const imageInput = document.querySelector("#image-input");
const preview = document.querySelector("#image-preview");
const statusMessage = document.querySelector(".status");

let currentImageUrl = null;

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
