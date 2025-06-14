document.addEventListener("DOMContentLoaded", function () {
  // --- Config ---
  const swatchSelector = ".variant-swatch";
  const buyBtnSelector = ".buy-multi-btn";
  const summarySelector = ".selected-colors-summary";
  const summaryTextSelector = ".selected-colors-text";
  const addToCartSelector =
    'form[data-type="add-to-cart-form"] [type="submit"]';
  const hiddenInputSelector =
    'form[data-type="add-to-cart-form"] input[name="id"]';

  // --- State ---
  let maxSelect = 3; // Default to 3
  let selections = [];
  let variantIdToTitle = {};
  let swatches = Array.from(document.querySelectorAll(swatchSelector));
  let addToCartBtn = document.querySelector(addToCartSelector);
  let hiddenInput = document.querySelector(hiddenInputSelector);

  // --- Map variant id to title for summary ---
  swatches.forEach((btn) => {
    variantIdToTitle[btn.getAttribute("data-variant-id")] =
      btn.getAttribute("aria-label");
  });

  // --- Buy 1/3/5 toggle logic ---
  const buyBtns = Array.from(document.querySelectorAll(buyBtnSelector));
  function setActiveBuyBtn(max) {
    buyBtns.forEach((b) => b.classList.remove("active"));
    const btn = buyBtns.find((b) => b.getAttribute("data-max") == String(max));
    if (btn) btn.classList.add("active");
  }

  function updateDiscountText() {
    const perItemSpan = document.querySelector(".multi-buy-per-item");
    const saveSpan = document.querySelector(".multi-buy-save");
    // Set your regular prices here
    const regularPrice = 10.0;
    let per = "";
    let save = "";
    if (maxSelect === 3) {
      const total = 25.2;
      per = `₹${(total / 3).toFixed(2)}/Per StickyGrippy`;
      save = `SAVE ₹${(regularPrice * 3 - total).toFixed(2)}`;
    } else if (maxSelect === 5) {
      const total = 40.0;
      per = `₹${(total / 5).toFixed(2)}/Per StickyGrippy`;
      save = `SAVE ₹${(regularPrice * 5 - total).toFixed(2)}`;
    }
    perItemSpan.textContent = per;
    saveSpan.textContent = save;
  }

  // Call on load and on button switch
  updateDiscountText();

  // Set Buy 3 as default active on load
  setActiveBuyBtn(3);
  maxSelect = 3;

  buyBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const newMax = parseInt(btn.getAttribute("data-max"), 10);
      if (maxSelect !== newMax) {
        maxSelect = newMax;
        setActiveBuyBtn(maxSelect);
        resetSelections();
        updateDiscountText();
      }
    });
  });

  // --- Swatch click logic ---
  swatches.forEach((btn) => {
    btn.addEventListener("click", function () {
      if (btn.hasAttribute("disabled")) return;
      const vid = btn.getAttribute("data-variant-id");
      const title = variantIdToTitle[vid];

      let selIndex = selections.findIndex((s) => s.id === vid);
      let sel = selections[selIndex];

      if (sel) {
        // Only increment if totalSelected < maxSelect
        if (totalSelected() < maxSelect) {
          sel.count++;
        } else if (sel.count < maxSelect) {
          // At max, but this swatch is not at max, so increment and remove from others
          sel.count++;
          let toReduce = 1;
          for (let i = 0; i < selections.length && toReduce > 0; i++) {
            if (selections[i].id !== vid && selections[i].count > 0) {
              if (selections[i].count > toReduce) {
                selections[i].count -= toReduce;
                toReduce = 0;
              } else {
                toReduce -= selections[i].count;
                selections[i].count = 0;
              }
            }
          }
          // Remove any with count 0
          selections = selections.filter((s) => s.count > 0);
        }
        // Prevent this swatch from exceeding maxSelect
        if (sel.count > maxSelect) {
          sel.count = maxSelect;
        }
      } else {
        // Not selected yet
        if (totalSelected() < maxSelect) {
          selections.push({ id: vid, title: title, count: 1 });
        } else {
          // Remove from the oldest selection(s)
          let toReduce = 1;
          for (let i = 0; i < selections.length && toReduce > 0; i++) {
            if (selections[i].count > toReduce) {
              selections[i].count -= toReduce;
              toReduce = 0;
            } else {
              toReduce -= selections[i].count;
              selections[i].count = 0;
            }
          }
          selections = selections.filter((s) => s.count > 0);
          selections.push({ id: vid, title: title, count: 1 });
        }
      }
      updateUI();
    });
  });

  // --- Helpers ---
  function totalSelected() {
    return selections.reduce((sum, s) => sum + s.count, 0);
  }
  function removeFirstSelection() {
    if (selections.length === 0) return;
    if (selections[0].count > 1) {
      selections[0].count--;
    } else {
      selections.shift();
    }
  }
  function resetSelections() {
    selections = [];
    updateUI();
  }
  function updateUI() {
    swatches.forEach((btn) => {
      const vid = btn.getAttribute("data-variant-id");
      let sel = selections.find((s) => s.id === vid);
      btn.classList.toggle("selected", !!sel);
      let overlay = btn.querySelector(".swatch-qty-overlay");
      if (sel) {
        overlay.textContent = sel.count;
        overlay.style.opacity = 1;
      } else {
        overlay.textContent = "";
        overlay.style.opacity = 0;
      }
    });
    const summaryDiv = document.querySelector(summarySelector);
    const summaryTextSpan = document.querySelector(summaryTextSelector);

    if (summaryDiv && summaryTextSpan) {
      if (selections.length === 0) {
        summaryTextSpan.textContent = "";
      } else {
        summaryTextSpan.textContent = selections
          .map((s) => `${s.title}(${s.count})`)
          .join(", ");
      }
    }
    if (addToCartBtn) {
      addToCartBtn.disabled = totalSelected() !== maxSelect;
    }
    if (hiddenInput) {
      if (maxSelect === 1 && selections.length === 1) {
        hiddenInput.value = selections[0].id;
      } else {
        hiddenInput.value = selections[0] ? selections[0].id : "";
      }
    }
  }

  if (addToCartBtn) {
    addToCartBtn.addEventListener("click", function (e) {
      if (totalSelected() !== maxSelect) {
        e.preventDefault();
        return;
      }
      e.preventDefault();

      addToCartBtn.disabled = true;
      addToCartBtn.classList.add("loading");

      // Prepare array of items for Shopify's /cart/add.js
      const items = selections.map((sel) => ({
        id: sel.id,
        quantity: sel.count,
      }));

      fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      })
        .then((res) => res.json())
        .then(() => {
          resetSelections();
          addToCartBtn.disabled = true;
          addToCartBtn.classList.remove("loading");

          // --- Refreshless cart drawer or notification update ---
          const cartDrawer = document.querySelector("cart-drawer");
          if (cartDrawer && typeof cartDrawer.open === "function") {
            cartDrawer.open();
            fetch("/?section_id=cart-drawer")
              .then((res) => res.text())
              .then((html) => {
                const tempDiv = document.createElement("div");
                tempDiv.innerHTML = html;
                const newDrawer = tempDiv.querySelector("cart-drawer");
                if (newDrawer) {
                  cartDrawer.innerHTML = newDrawer.innerHTML;
                  cartDrawer.classList.remove("is-empty");
                  const emptyMessage = cartDrawer.querySelector(
                    ".drawer__inner-empty"
                  );
                  if (emptyMessage) emptyMessage.style.display = "none";
                }
                fetch(window.location.href)
                  .then((res) => res.text())
                  .then((html) => {
                    const tempBubbleDiv = document.createElement("div");
                    tempBubbleDiv.innerHTML = html;
                    const newBubbleContent =
                      tempBubbleDiv.querySelector("#cart-icon-bubble");
                    const currentBubble =
                      document.querySelector("#cart-icon-bubble");
                    if (newBubbleContent && currentBubble) {
                      currentBubble.innerHTML = newBubbleContent.innerHTML;
                    }
                  });
              });
            return;
          }

          const cartNotification = document.getElementById("cart-notification");
          if (cartNotification) {
            cartNotification.style.display = "block";
            fetch("/?section_id=cart-notification")
              .then((res) => res.text())
              .then((html) => {
                const tempDiv = document.createElement("div");
                tempDiv.innerHTML = html;
                const newNotif = tempDiv.querySelector("#cart-notification");
                if (newNotif) {
                  cartNotification.innerHTML = newNotif.innerHTML;
                }
              });
            return;
          }
        })
        .catch(() => {
          addToCartBtn.disabled = false;
          addToCartBtn.classList.remove("loading");
          alert("Error adding products to cart.");
        });
    });
  }

  // --- Init ---
  resetSelections();
});
