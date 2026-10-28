const imageSlots = [
  {
    input: document.querySelector("#image-1-input"),
    preview: document.querySelector("#image-1-preview"),
    status: document.querySelector("#image-1-status"),
    label: "Image 1"
  },
  {
    input: document.querySelector("#image-2-input"),
    preview: document.querySelector("#image-2-preview"),
    status: document.querySelector("#image-2-status"),
    label: "Image 2"
  }
];

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
