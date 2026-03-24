import { PRODUCTS, productImageSrc } from "./data.js";
import { addToCart, moneyPHP } from "./app.js";

function el(sel, root = document) {
  return root.querySelector(sel);
}

export function mountHome() {
  const featuredHost = el("[data-cc-featured]");
  if (featuredHost) {
    const featured = PRODUCTS.slice(0, 4);
    featuredHost.innerHTML = featured
      .map((p) => {
        const href = `product.html?id=${encodeURIComponent(p.id)}`;
        return `
          <article class="card reveal">
            <a href="${href}" class="block" aria-label="View ${p.name}">
              <img src="${productImageSrc(p)}" alt="${p.name}" loading="lazy" class="w-full h-44 object-cover"/>
            </a>
            <div class="p-5">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="text-xs text-white/55">${p.category}</div>
                  <h3 class="mt-1 font-semibold leading-snug">${p.name}</h3>
                </div>
                <div class="font-bold">${moneyPHP(p.price)}</div>
              </div>
              <p class="mt-3 text-white/65 text-sm">${p.short}</p>
              <div class="mt-5 flex gap-2">
                <a class="btn btn-ghost flex-1 py-3" href="${href}">Details</a>
                <button class="btn btn-primary flex-1 py-3" type="button" data-cc-add data-id="${p.id}">Add</button>
              </div>
            </div>
          </article>
        `;
      })
      .join("");

    featuredHost.querySelectorAll("[data-cc-add]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        if (!id) return;
        addToCart(id, 1);
        btn.textContent = "Added";
        setTimeout(() => (btn.textContent = "Add"), 900);
      });
    });
  }
}

