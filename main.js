const imageSlots = [
  {
    input: document.querySelector("#image-1-input"),
    preview: document.querySelector("#image-1-preview"),
    status: document.querySelector("#image-1-status"),
    description: document.querySelector("#description-1-title").closest(".description-panel").querySelector(".description-area"),
    label: "Image 1"
  },
  {
    input: document.querySelector("#image-2-input"),
    preview: document.querySelector("#image-2-preview"),
    status: document.querySelector("#image-2-status"),
    description: document.querySelector("#description-2-title").closest(".description-panel").querySelector(".description-area"),
    label: "Image 2"
  }
];

const OLLAMA_URL = "http://127.0.0.1:11434/api/generate";
const MODEL_NAME = "llava";
const describeButton = document.querySelector(".describe-button");
const actionStatus = document.querySelector("#action-status");
let isProcessing = false;

function showPlaceholder(slot) {
  const placeholder = document.createElement("div");
  placeholder.className = "preview-empty";
  placeholder.setAttribute("aria-hidden", "true");

  const icon = document.createElement("span");
  icon.className = "image-icon";
  const message = document.createElement("p");
  message.textContent = `${slot.label} preview will appear here`;

  placeholder.append(icon, message);
  slot.preview.replaceChildren(placeholder);
}

imageSlots.forEach((slot) => {
  let currentImageUrl = null;

  slot.input.addEventListener("change", () => {
    if (currentImageUrl) {
      URL.revokeObjectURL(currentImageUrl);
      currentImageUrl = null;
    }
    showPlaceholder(slot);
    slot.status.classList.remove("error", "success");
    slot.description.textContent = `The description for ${slot.label} will appear here.`;
    slot.description.classList.remove("has-description");

    const file = slot.input.files[0];
    if (!file) {
      slot.status.textContent = "Select an image to see its preview.";
      return;
    }

    if (!file.type.startsWith("image/")) {
      slot.input.value = "";
      slot.status.textContent = "That file is not an image. Please choose an image file.";
      slot.status.classList.add("error");
      return;
    }

    currentImageUrl = URL.createObjectURL(file);
    const image = document.createElement("img");
    image.src = currentImageUrl;
    image.alt = `${slot.label} preview of ${file.name}`;
    slot.preview.replaceChildren(image);
    slot.status.textContent = `${file.name} is ready to preview.`;
    slot.status.classList.add("success");
  });
});

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result !== "string") {
        reject(new Error(`Could not read ${file.name}. Please choose the image again.`));
        return;
      }
      resolve(reader.result.slice(reader.result.indexOf(",") + 1));
    });
    reader.addEventListener("error", () => reject(new Error(`Could not read ${file.name}. Please choose the image again.`)));
    reader.readAsDataURL(file);
  });
}

async function describeImage(slot, file) {
  slot.status.classList.remove("error", "success");
  slot.status.textContent = `Sending ${slot.label} to Ollama…`;
  slot.description.textContent = "";
  slot.description.classList.remove("has-description");

  try {
    const image = await readFileAsBase64(file);
    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL_NAME,
        prompt: "Describe the image clearly and concisely in English. Mention the main subjects and relevant visible details.",
        images: [image],
        stream: false
      })
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || `Ollama returned an error (${response.status}).`);
    }
    if (typeof result.response !== "string" || !result.response.trim()) {
      throw new Error("Ollama returned an empty description. Please try again.");
    }

    slot.description.textContent = result.response.trim();
    slot.description.classList.add("has-description");
    slot.status.textContent = `${slot.label} description complete.`;
    slot.status.classList.add("success");
    return true;
  } catch (error) {
    slot.description.textContent = "";
    slot.description.classList.remove("has-description");
    slot.status.textContent = error instanceof TypeError
      ? `Could not reach Ollama for ${slot.label}. Check that Ollama is running and this page is allowed in its CORS settings.`
      : error.message || `Could not describe ${slot.label}. Please try again.`;
    slot.status.classList.add("error");
    return false;
  }
}

describeButton.addEventListener("click", async () => {
  if (isProcessing) return;

  const selectedImages = imageSlots.map((slot) => ({ slot, file: slot.input.files[0] }));
  const hasSelectedImage = selectedImages.some(({ file }) => file);
  actionStatus.classList.remove("error", "success");

  if (!hasSelectedImage) {
    actionStatus.textContent = "No images selected. Please select Image 1, Image 2, or both.";
    actionStatus.classList.add("error");
    return;
  }

  isProcessing = true;
  describeButton.disabled = true;
  describeButton.textContent = "Describing Images…";
  imageSlots.forEach(({ input }) => { input.disabled = true; });
  actionStatus.textContent = "Processing selected images one at a time…";

  try {
    let requestFailed = false;
    for (const { slot, file } of selectedImages) {
      if (!file) {
        slot.status.classList.remove("error", "success");
        slot.status.textContent = `No image selected for ${slot.label}. This image was skipped.`;
        slot.description.textContent = `No image was selected for ${slot.label}.`;
        slot.description.classList.remove("has-description");
        continue;
      }

      const succeeded = await describeImage(slot, file);
      requestFailed ||= !succeeded;
    }
    if (requestFailed) {
      actionStatus.textContent = "Processing finished. Review the image error messages above.";
      actionStatus.classList.add("error");
    } else {
      actionStatus.textContent = "Processing finished. Check each image's status above.";
      actionStatus.classList.add("success");
    }
  } finally {
    isProcessing = false;
    describeButton.disabled = false;
    describeButton.textContent = "Describe Images";
    imageSlots.forEach(({ input }) => { input.disabled = false; });
  }
});
