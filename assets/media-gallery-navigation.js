document.addEventListener("DOMContentLoaded", function () {
  // Main gallery and arrows
  const galleryList = document.getElementById(
    "Slider-Gallery-{{ section.id }}"
  );
  const leftArrow =
    galleryList.parentElement.querySelector(".main-arrow--left");
  const rightArrow =
    galleryList.parentElement.querySelector(".main-arrow--right");

  // Thumbnails
  const thumbnailList = document.getElementById(
    "Slider-Thumbnails-{{ section.id }}"
  );
  if (!thumbnailList) return;
  const thumbnails = Array.from(
    thumbnailList.querySelectorAll("button.thumbnail")
  );

  // Find the currently selected thumbnail index
  function getCurrentIndex() {
    return thumbnails.findIndex(
      (btn) => btn.getAttribute("aria-current") === "true"
    );
  }

  function updateArrowState() {
    const idx = getCurrentIndex();
    leftArrow.disabled = idx <= 0;
    rightArrow.disabled = idx >= thumbnails.length - 1;
  }

  // Arrow click handlers
  leftArrow.addEventListener("click", function () {
    const idx = getCurrentIndex();
    if (idx > 0) {
      thumbnails[idx - 1].click();
      setTimeout(updateArrowState, 50);
    }
  });
  rightArrow.addEventListener("click", function () {
    const idx = getCurrentIndex();
    if (idx < thumbnails.length - 1) {
      thumbnails[idx + 1].click();
      setTimeout(updateArrowState, 50);
    }
  });

  // Also update arrow state on thumbnail click (in case user clicks a thumbnail directly)
  thumbnails.forEach((btn) => {
    btn.addEventListener("click", function () {
      setTimeout(updateArrowState, 50);
    });
  });

  // Initial state
  updateArrowState();
});
