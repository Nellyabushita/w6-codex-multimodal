const imageInput = document.querySelector("#image-input");
const preview = document.querySelector("#image-preview");
const statusMessage = document.querySelector(".status");
const describeButton = document.querySelector(".describe-button");
const descriptionArea = document.querySelector(".description-empty");

const OLLAMA_URL = "http://127.0.0.1:11434/api/generate";
const MODEL_NAME = "llava";

let currentImageUrl = null;
let isProcessing = false;

function clearPreview() {
  if (currentImageUrl) {
    URL.revokeObjectURL(currentImageUrl);
    currentImageUrl = null;
  }

  const placeholder = document.createElement("div");
  placeholder.className = "preview-empty";
  placeholder.setAttribute("aria-hidden", "true");
  placeholder.innerHTML = '<span class="image-icon"><span></span></span><p>Your image will appear here</p>';
  preview.replaceChildren(placeholder);
}

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  clearPreview();
  statusMessage.classList.remove("error");
  statusMessage.classList.remove("success");
  descriptionArea.textContent = "Your image description will appear here.";
  descriptionArea.classList.remove("has-description");

  if (!file) {
    statusMessage.textContent = "Select an image to get started.";
    return;
  }

  if (!file.type.startsWith("image/")) {
    imageInput.value = "";
    statusMessage.textContent = "That file is not an image. Please choose an image file.";
    statusMessage.classList.add("error");
    return;
  }

  currentImageUrl = URL.createObjectURL(file);
  const image = document.createElement("img");
  image.src = currentImageUrl;
  image.alt = `Preview of ${file.name}`;
  preview.replaceChildren(image);
  statusMessage.textContent = `${file.name} is ready to preview.`;
});

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== "string") {
        reject(new Error("The selected image could not be read."));
        return;
      }
      resolve(dataUrl.slice(dataUrl.indexOf(",") + 1));
    });
    reader.addEventListener("error", () => reject(new Error("The selected image could not be read.")));
    reader.readAsDataURL(file);
  });
}

describeButton.addEventListener("click", async () => {
  if (isProcessing) return;

  const file = imageInput.files[0];
  statusMessage.classList.remove("error");
  statusMessage.classList.remove("success");

  if (!file) {
    statusMessage.textContent = "Please select an image before describing it.";
    statusMessage.classList.add("error");
    return;
  }

  if (!file.type.startsWith("image/")) {
    statusMessage.textContent = "That file is not an image. Please choose an image file.";
    statusMessage.classList.add("error");
    return;
  }

  isProcessing = true;
  describeButton.disabled = true;
  imageInput.disabled = true;
  describeButton.textContent = "Describing…";
  statusMessage.textContent = "Sending your image to Ollama. This may take a little while…";
  descriptionArea.textContent = "Generating a description…";

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

    descriptionArea.textContent = result.response.trim();
    descriptionArea.classList.add("has-description");
    statusMessage.textContent = "Description complete.";
    statusMessage.classList.add("success");
  } catch (error) {
    descriptionArea.textContent = "Your image description will appear here.";
    descriptionArea.classList.remove("has-description");
    if (error instanceof TypeError) {
      statusMessage.textContent = "Could not reach Ollama. Make sure Ollama is running and allow this local page in its CORS settings.";
    } else {
      statusMessage.textContent = error.message || "Something went wrong while describing the image.";
    }
    statusMessage.classList.add("error");
  } finally {
    isProcessing = false;
    describeButton.disabled = false;
    imageInput.disabled = false;
    describeButton.textContent = "Describe Image";
  }
});
