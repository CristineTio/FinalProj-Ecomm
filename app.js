/* Coconut Coir E-Commerce — Shared UI + localStorage systems.
   This is intentionally framework-free (vanilla JS + ES modules). */

import { BRAND, CATEGORIES, PRODUCTS, getProductById, productImageSrc } from "./data.js";

const STORAGE_KEYS = {
  cart: "cc_cart",
  user: "cc_user",
  orders: "cc_orders",
};

function safeJsonParse(text, fallback) {
  try {
    const v = JSON.parse(text);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

export function moneyPHP(amount) {
  // Placeholder currency formatting (PHP). Adjust locale/currency if needed.
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(
    Number(amount || 0),
  );
}

export function getCart() {
  const raw = localStorage.getItem(STORAGE_KEYS.cart);
  const cart = safeJsonParse(raw, []);
  return Array.isArray(cart) ? cart : [];
}

export function setCart(items) {
  localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("cc:cart-changed"));
}

export function cartCount() {
  return getCart().reduce((n, it) => n + (Number(it.qty) || 0), 0);
}

export function addToCart(productId, qty = 1) {
  const p = getProductById(productId);
  if (!p) return { ok: false, message: "Product not found." };
  const q = Math.max(1, Math.min(99, Number(qty) || 1));
  const cart = getCart();
  const existing = cart.find((x) => x.id === productId);
  if (existing) existing.qty = Math.max(1, Math.min(99, (Number(existing.qty) || 0) + q));
  else cart.push({ id: productId, qty: q });
  setCart(cart);
  return { ok: true };
}

export function updateCartQty(productId, qty) {
  const q = Math.max(1, Math.min(99, Number(qty) || 1));
  const cart = getCart().map((it) => (it.id === productId ? { ...it, qty: q } : it));
  setCart(cart);
}

export function removeFromCart(productId) {
  const cart = getCart().filter((it) => it.id !== productId);
  setCart(cart);
}

export function cartLineItems() {
  const cart = getCart();
  return cart
    .map((it) => {
      const p = getProductById(it.id);
      if (!p) return null;
      const qty = Math.max(1, Number(it.qty) || 1);
      return { product: p, qty, lineTotal: qty * p.price };
    })
    .filter(Boolean);
}

export function cartSubtotal() {
  return cartLineItems().reduce((s, li) => s + li.lineTotal, 0);
}

export function getUser() {
  const raw = localStorage.getItem(STORAGE_KEYS.user);
  const u = safeJsonParse(raw, null);
  return u && typeof u === "object" ? u : null;
}

export function setUser(user) {
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
  window.dispatchEvent(new CustomEvent("cc:user-changed"));
}

export function logout() {
  localStorage.removeItem(STORAGE_KEYS.user);
  window.dispatchEvent(new CustomEvent("cc:user-changed"));
}

export function getOrders() {
  const raw = localStorage.getItem(STORAGE_KEYS.orders);
  const orders = safeJsonParse(raw, []);
  return Array.isArray(orders) ? orders : [];
}

export function setOrders(orders) {
  localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
}

function uid(prefix = "ORD") {
  const t = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = `${t.getFullYear()}${pad(t.getMonth() + 1)}${pad(t.getDate())}-${pad(t.getHours())}${pad(
    t.getMinutes(),
  )}${pad(t.getSeconds())}`;
  const rand = Math.random().toString(16).slice(2, 8).toUpperCase();
  return `${prefix}-${stamp}-${rand}`;
}

export function placeOrder(payload) {
  const user = getUser();
  const items = cartLineItems();
  if (items.length === 0) return { ok: false, message: "Your cart is empty." };
  if (!user) return { ok: false, message: "Please sign in to checkout." };

  const subtotal = cartSubtotal();
  const deliveryFee = payload.fulfillment?.method === "delivery" ? 99 : 0;
  const total = subtotal + deliveryFee;

  const order = {
    id: uid("CC"),
    createdAt: new Date().toISOString(),
    status: "Processing",
    user: { id: user.id, name: user.name, email: user.email },
    fulfillment: payload.fulfillment,
    payment: { method: payload.payment?.method || "card", last4: payload.payment?.last4 || "0000" },
    items: items.map((li) => ({ id: li.product.id, name: li.product.name, price: li.product.price, qty: li.qty })),
    subtotal,
    deliveryFee,
    total,
  };

  const orders = getOrders();
  orders.unshift(order);
  setOrders(orders);
  setCart([]);
  return { ok: true, order };
}

function el(sel, root = document) {
  return root.querySelector(sel);
}
function els(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

export function mountGlobalNav() {
  const host = el("[data-cc-nav]");
  if (!host) return;

  const user = getUser();
  host.innerHTML = `
    <a href="#main" class="skip-link btn btn-ghost">Skip to content</a>
    <div class="relative">
      <div class="top-glow" aria-hidden="true"></div>
      <div class="noise" aria-hidden="true"></div>
    </div>
    <div class="container-safe">
      <div class="flex items-center justify-between py-5">
        <a href="index.html" class="flex items-center gap-3 group" aria-label="${BRAND.name} home">
          <div class="w-11 h-13 rounded-3xls surface flex items-center justify-center glow-ring overflow-hidden">
            <img src="images/logo.png" alt="logo" class="h-15" />
          </div>
          <div class="leading-tight">
            <div class="font-semibold">${BRAND.name}</div>
            <div class="text-[12px] text-white/60">${BRAND.tagline}</div>
          </div>
        </a>

        <nav class="hidden md:flex items-center gap-2" aria-label="Primary navigation">
          <a class="btn btn-ghost py-3 px-4" href="storefront.html">Storefront</a>
          <a class="btn btn-ghost py-3 px-4" href="transactions.html">Transactions</a>
          <a class="btn btn-ghost py-3 px-4" href="profile.html">${user ? "Profile" : "Guest"}</a>
        </nav>

        <div class="flex items-center gap-2">
          <button class="btn btn-ghost py-3 px-4 md:hidden" type="button" data-cc-mobile-open aria-label="Open menu">
            <span aria-hidden="true">Menu</span>
          </button>
          <a class="btn btn-ghost py-3 px-4 hidden sm:inline-flex" href="storefront.html">
            Browse
          </a>
          <a class="btn btn-primary py-3 px-5" href="${user ? "cart.html" : "login.html"}" data-cc-nav-cta>
            <span>${user ? "Cart" : "Login"}</span>
            <span class="chip ml-1" data-cc-cart-count>0</span>
          </a>
        </div>
      </div>
    </div>

    <div class="container-safe md:hidden pb-4 hidden" data-cc-mobile-menu>
      <div class="surface rounded-3xl p-3">
        <a class="btn btn-ghost w-full justify-start py-3 px-4 mb-2" href="storefront.html">Storefront</a>
        <a class="btn btn-ghost w-full justify-start py-3 px-4 mb-2" href="transactions.html">Transaction History</a>
        <a class="btn btn-ghost w-full justify-start py-3 px-4 mb-2" href="profile.html">Profile</a>
        <a class="btn btn-ghost w-full justify-start py-3 px-4" href="${user ? "#" : "login.html"}" data-cc-auth-link>
          ${user ? "Sign out" : "Login / Register"}
        </a>
      </div>
    </div>
  `;

  const countNode = el("[data-cc-cart-count]", host);
  const updateCount = () => {
    const n = cartCount();
    if (countNode) countNode.textContent = String(n);
  };
  updateCount();
  window.addEventListener("cc:cart-changed", updateCount);

  const mobileBtn = el("[data-cc-mobile-open]", host);
  const mobileMenu = el("[data-cc-mobile-menu]", host);
  mobileBtn?.addEventListener("click", () => {
    const isHidden = mobileMenu?.classList.contains("hidden");
    mobileMenu?.classList.toggle("hidden", !isHidden);
  });

  const authLink = el("[data-cc-auth-link]", host);
  if (authLink && getUser()) {
    authLink.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
      window.location.href = "index.html";
    });
  }
}

export function mountFooter() {
  const host = el("[data-cc-footer]");
  if (!host) return;

  const year = new Date().getFullYear();

  host.innerHTML = `
    <div class="container-safe py-6">
      <div class="surface rounded-2xl px-5 py-4 text-sm">
        
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          <!-- Brand -->
          <div class="min-w-0">
            <div class="font-semibold">${BRAND.name}</div>
            <div class="text-white/60 text-xs">
              Sustainable coconut coir products
            </div>
          </div>

          <!-- Links -->
          <div class="flex flex-wrap gap-3 text-white/70 text-xs">
            <a href="storefront.html" class="hover:text-white">Store</a>
            <a href="cart.html" class="hover:text-white">Cart</a>
            <a href="transactions.html" class="hover:text-white">Orders</a>
            <a href="profile.html" class="hover:text-white">Profile</a>
          </div>

          <!-- Copyright -->
          <div class="text-white/50 text-xs">
            For educational use only, no copyright intended.
          </div>

        </div>

      </div>
    </div>
  `;
}

export function mountScrollReveal() {
  const nodes = els(".reveal");
  if (nodes.length === 0) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.12 },
  );
  nodes.forEach((n) => io.observe(n));
}

export function mountCatalogGrid({ mountId = "catalogGrid", filterId = "catalogFilters" } = {}) {
  const grid = el(`#${mountId}`);
  if (!grid) return;

  const filterHost = el(`#${filterId}`);
  if (filterHost) {
    filterHost.innerHTML = `
      <div class="flex flex-col lg:flex-row gap-3 lg:items-end">
        <div class="flex-1">
          <label class="text-white/70 text-sm" for="q">Search</label>
          <input id="q" class="field mt-2" placeholder="Try “brick”, “orchid”, “grow bag”…"/>
        </div>
        <div class="w-full lg:w-56">
          <label class="text-white/70 text-sm" for="cat">Category</label>
          <select id="cat" class="field mt-2">
            ${CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join("")}
          </select>
        </div>
        <div class="w-full lg:w-56">
          <label class="text-white/70 text-sm" for="sort">Sort</label>
          <select id="sort" class="field mt-2">
            <option value="featured">Featured</option>
            <option value="priceAsc">Price: low → high</option>
            <option value="priceDesc">Price: high → low</option>
            <option value="nameAsc">Name: A → Z</option>
          </select>
        </div>
      </div>
    `;
  }

  const q = () => el("#q")?.value?.trim().toLowerCase() || "";
  const cat = () => el("#cat")?.value || "All";
  const sort = () => el("#sort")?.value || "featured";

  function sorted(list) {
    const mode = sort();
    const arr = [...list];
    if (mode === "priceAsc") arr.sort((a, b) => a.price - b.price);
    if (mode === "priceDesc") arr.sort((a, b) => b.price - a.price);
    if (mode === "nameAsc") arr.sort((a, b) => a.name.localeCompare(b.name));
    return arr;
  }

  function matches(p) {
    const query = q();
    const c = cat();
    const inCat = c === "All" ? true : p.category === c;
    const inQuery =
      !query ||
      [p.name, p.short, p.details, p.category, ...(p.tags || [])].join(" ").toLowerCase().includes(query);
    return inCat && inQuery;
  }

  function render() {
    const list = sorted(PRODUCTS.filter(matches));
    if (list.length === 0) {
      grid.innerHTML = `
        <div class="surface rounded-3xl p-8 text-center text-white/70">
          No products match your search. Try a different keyword or category.
        </div>
      `;
      return;
    }

    grid.innerHTML = list
      .map((p) => {
        const href = `product.html?id=${encodeURIComponent(p.id)}`;
        const img = productImageSrc(p);
        return `
          <article class="card">
            <a href="${href}" class="block" aria-label="View ${p.name}">
              <img src="${img}" alt="${p.name}" loading="lazy" class="w-full h-48 object-cover"/>
            </a>
            <div class="p-5">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="text-xs text-white/55">${p.category}</div>
                  <h3 class="mt-1 font-semibold leading-snug">${p.name}</h3>
                </div>
                <div class="text-right">
                  <div class="text-white/70 text-xs">From</div>
                  <div class="font-bold">${moneyPHP(p.price)}</div>
                </div>
              </div>
              <p class="mt-3 text-white/65 text-sm">${p.short}</p>
              <div class="mt-4 flex flex-wrap gap-2">
                ${(p.tags || []).slice(0, 2).map((t) => `<span class="chip">${t}</span>`).join("")}
              </div>
              <div class="mt-5 flex gap-2">
                <a class="btn btn-ghost flex-1 py-3" href="${href}">Details</a>
                <button class="btn btn-primary flex-1 py-3" type="button" data-cc-add data-id="${p.id}">
                  Add to cart
                </button>
              </div>
            </div>
          </article>
        `;
      })
      .join("");

    els("[data-cc-add]", grid).forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        if (!id) return;
        addToCart(id, 1);
        btn.blur();
        btn.textContent = "Added";
        setTimeout(() => (btn.textContent = "Add to cart"), 900);
      });
    });
  }

  els("#q, #cat, #sort").forEach((n) => n?.addEventListener("input", render));
  render();
}

export function mountProductPage() {
  const host = el("[data-cc-product]");
  if (!host) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id") || "";
  const p = getProductById(id);

  if (!p) {
    host.innerHTML = `
      <div class="surface rounded-3xl p-8 text-white/70">
        Product not found. <a class="link" href="storefront.html">Back to Storefront</a>.
      </div>
    `;
    return;
  }

  const img = productImageSrc(p);
  host.innerHTML = `
    <div class="grid lg:grid-cols-2 gap-6 items-start">
      <div class="card overflow-hidden">
        <img src="${img}" alt="${p.name}" class="w-full h-[320px] sm:h-[420px] object-cover" loading="lazy"/>
      </div>
      <div class="surface rounded-3xl p-6 md:p-8">
        <div class="text-white/55 text-sm">${p.category}</div>
        <h1 class="mt-2 text-3xl md:text-4xl font-black tracking-tight">${p.name}</h1>
        <p class="mt-4 text-white/70">${p.details}</p>

        <div class="mt-5 flex flex-wrap gap-2">
          ${(p.tags || []).map((t) => `<span class="chip">${t}</span>`).join("")}
        </div>

        <div class="mt-6 grid sm:grid-cols-2 gap-3">
          ${(p.specs || [])
            .map(
              ([k, v]) => `
              <div class="surface-2 rounded-2xl p-4 border hairline">
                <div class="text-xs text-white/55">${k}</div>
                <div class="mt-1 font-semibold">${v}</div>
              </div>`,
            )
            .join("")}
        </div>

        <div class="mt-7 flex items-center justify-between gap-4">
          <div>
            <div class="text-white/60 text-sm">Price</div>
            <div class="text-2xl font-extrabold grad-text">${moneyPHP(p.price)}</div>
          </div>
          <div class="flex gap-2">
            <label class="sr-only" for="qty">Quantity</label>
            <input id="qty" class="field w-24 text-center" type="number" inputmode="numeric" min="1" max="99" value="1"/>
            <button class="btn btn-primary py-3 px-6" type="button" data-cc-add-one>
              Add to cart
            </button>
          </div>
        </div>

        <div class="mt-6 flex gap-2">
          <a class="btn btn-ghost py-3 px-5" href="storefront.html">Back</a>
          <a class="btn btn-ghost py-3 px-5" href="cart.html">Go to cart</a>
        </div>
      </div>
    </div>
  `;

  const qty = el("#qty", host);
  const btn = el("[data-cc-add-one]", host);
  btn?.addEventListener("click", () => {
    const amount = Math.max(1, Math.min(99, Number(qty?.value) || 1));
    addToCart(p.id, amount);
    btn.textContent = "Added";
    setTimeout(() => (btn.textContent = "Add to cart"), 900);
  });
}

export function mountCartPage() {
  const host = el("[data-cc-cart]");
  if (!host) return;

  const render = () => {
    const items = cartLineItems();
    const subtotal = cartSubtotal();
    host.innerHTML = `
      <div class="grid lg:grid-cols-3 gap-6 items-start">
        <section class="lg:col-span-2 surface rounded-3xl p-6 md:p-8">
          <div class="flex items-center justify-between gap-4">
            <h1 class="text-2xl md:text-3xl font-black tracking-tight">Cart</h1>
            <a class="btn btn-ghost py-3 px-5" href="storefront.html">Continue shopping</a>
          </div>
          <div class="hairline border-t mt-5 pt-5">
            ${
              items.length === 0
                ? `<div class="text-white/70">Your cart is empty. <a class="link" href="storefront.html">Browse products</a>.</div>`
                : `<div class="space-y-4">
                    ${items
                      .map((li) => {
                        const img = productImageSrc(li.product);
                        return `
                          <div class="surface-2 rounded-2xl p-4 border hairline flex flex-col sm:flex-row gap-4 sm:items-center">
                            <img src="${img}" alt="${li.product.name}" loading="lazy" class="w-full sm:w-40 h-28 object-cover rounded-xl border border-white/10"/>
                            <div class="flex-1 min-w-0">
                              <div class="text-white/55 text-xs">${li.product.category}</div>
                              <div class="font-semibold truncate">${li.product.name}</div>
                              <div class="text-white/65 text-sm mt-1">${moneyPHP(li.product.price)} each</div>
                              <button type="button" class="link text-sm mt-2" data-cc-remove data-id="${li.product.id}" aria-label="Remove ${li.product.name}">Remove</button>
                            </div>
                            <div class="flex items-center justify-between sm:justify-end gap-3">
                              <label class="sr-only" for="qty-${li.product.id}">Quantity</label>
                              <input id="qty-${li.product.id}" class="field w-24 text-center" type="number" min="1" max="99" value="${li.qty}" data-cc-qty data-id="${li.product.id}" inputmode="numeric"/>
                              <div class="text-right min-w-[120px]">
                                <div class="text-white/55 text-xs">Line total</div>
                                <div class="font-bold">${moneyPHP(li.lineTotal)}</div>
                              </div>
                            </div>
                          </div>
                        `;
                      })
                      .join("")}
                  </div>`
            }
          </div>
        </section>

        <aside class="surface rounded-3xl p-6 md:p-8">
          <h2 class="text-xl font-bold">Summary</h2>
          <div class="mt-4 space-y-3 text-white/75">
            <div class="flex items-center justify-between">
              <span>Subtotal</span>
              <span class="font-semibold">${moneyPHP(subtotal)}</span>
            </div>
            <div class="flex items-center justify-between">
              <span>Estimated delivery</span>
              <span class="text-white/60">Calculated at checkout</span>
            </div>
          </div>
          <div class="hairline border-t mt-5 pt-5">
            <a class="btn btn-primary w-full py-4" href="checkout.html" aria-label="Proceed to checkout">
              Proceed to checkout
            </a>
            <div class="mt-3 text-white/55 text-sm">
              Tip: Use <span class="kbd">Tab</span> to navigate, then <span class="kbd">Enter</span> to activate buttons.
            </div>
          </div>
        </aside>
      </div>
    `;

    els("[data-cc-qty]", host).forEach((input) => {
      input.addEventListener("change", () => {
        const id = input.getAttribute("data-id");
        if (!id) return;
        updateCartQty(id, input.value);
      });
    });
    els("[data-cc-remove]", host).forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        if (!id) return;
        removeFromCart(id);
      });
    });
  };

  window.addEventListener("cc:cart-changed", render);
  render();
}

export function mountCheckoutPage() {
  const host = el("[data-cc-checkout]");
  if (!host) return;

  const user = getUser();
  if (!user) {
    host.innerHTML = `
      <div class="surface rounded-3xl p-8 text-white/70">
        Please <a class="link" href="login.html">sign in</a> to checkout.
      </div>
    `;
    return;
  }

  const items = cartLineItems();
  if (items.length === 0) {
    host.innerHTML = `
      <div class="surface rounded-3xl p-8 text-white/70">
        Your cart is empty. <a class="link" href="storefront.html">Browse products</a>.
      </div>
    `;
    return;
  }

  const subtotal = cartSubtotal();

  host.innerHTML = `
    <form class="grid lg:grid-cols-3 gap-6 items-start" data-cc-checkout-form>
      <section class="lg:col-span-2 space-y-6">
        <div class="surface rounded-3xl p-6 md:p-8">
          <h1 class="text-2xl md:text-3xl font-black tracking-tight">Checkout</h1>
          <p class="mt-2 text-white/65">Fast, minimal, and accessible. No real payments are processed.</p>
        </div>

        <div class="surface rounded-3xl p-6 md:p-8">
          <h2 class="text-xl font-bold">Fulfillment</h2>
          <div class="mt-4 grid sm:grid-cols-2 gap-3">
            <label class="surface-2 rounded-2xl p-4 border hairline cursor-pointer flex gap-3 items-start">
              <input type="radio" name="fulfillment" value="pickup" class="mt-1" checked aria-label="Pick up order"/>
              <div>
                <div class="font-semibold">Pickup</div>
                <div class="text-white/60 text-sm">Ready within 24 hours. No fee.</div>
              </div>
            </label>
            <label class="surface-2 rounded-2xl p-4 border hairline cursor-pointer flex gap-3 items-start">
              <input type="radio" name="fulfillment" value="delivery" class="mt-1" aria-label="Deliver order"/>
              <div>
                <div class="font-semibold">Delivery</div>
                <div class="text-white/60 text-sm">Flat fee added at checkout.</div>
              </div>
            </label>
          </div>

          <div class="mt-4 grid sm:grid-cols-2 gap-3">
            <div>
              <label class="text-white/70 text-sm" for="address">Address (delivery)</label>
              <input id="address" class="field mt-2" placeholder="House / Street / City" autocomplete="street-address"/>
            </div>
            <div>
              <label class="text-white/70 text-sm" for="pickup">Pickup note (optional)</label>
              <input id="pickup" class="field mt-2" placeholder="Preferred time window" />
            </div>
          </div>
        </div>

        <div class="surface rounded-3xl p-6 md:p-8">
          <h2 class="text-xl font-bold">Payment</h2>
          <div class="mt-4 grid sm:grid-cols-2 gap-3">
            <div>
              <label class="text-white/70 text-sm" for="card">Card number</label>
              <input id="card" class="field mt-2" inputmode="numeric" autocomplete="cc-number" placeholder="4242 4242 4242 4242" aria-label="Card number"/>
            </div>
            <div>
              <label class="text-white/70 text-sm" for="name">Name on card</label>
              <input id="name" class="field mt-2" autocomplete="cc-name" placeholder="${user.name}" aria-label="Name on card"/>
            </div>
            <div>
              <label class="text-white/70 text-sm" for="exp">Expiry</label>
              <input id="exp" class="field mt-2" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/YY" aria-label="Expiry"/>
            </div>
            <div>
              <label class="text-white/70 text-sm" for="cvc">CVC</label>
              <input id="cvc" class="field mt-2" inputmode="numeric" autocomplete="cc-csc" placeholder="123" aria-label="CVC"/>
            </div>
          </div>

          <div class="mt-4">
            <label class="text-white/70 text-sm" for="method">Payment method</label>
            <select id="method" class="field mt-2">
              <option value="card">Card</option>
              <option value="gcash">GCash (placeholder)</option>
              <option value="cod">Cash on delivery (placeholder)</option>
            </select>
          </div>
        </div>
      </section>

      <aside class="surface rounded-3xl p-6 md:p-8">
        <h2 class="text-xl font-bold">Order summary</h2>
        <div class="mt-4 space-y-3">
          ${items
            .slice(0, 4)
            .map((li) => `<div class="flex justify-between gap-3 text-white/75">
              <div class="min-w-0">
                <div class="truncate">${li.product.name}</div>
                <div class="text-white/55 text-sm">Qty ${li.qty}</div>
              </div>
              <div class="font-semibold">${moneyPHP(li.lineTotal)}</div>
            </div>`)
            .join("")}
        </div>

        <div class="hairline border-t mt-5 pt-5 space-y-3 text-white/75">
          <div class="flex justify-between">
            <span>Subtotal</span>
            <span class="font-semibold">${moneyPHP(subtotal)}</span>
          </div>
          <div class="flex justify-between">
            <span>Delivery fee</span>
            <span class="font-semibold" data-cc-delivery-fee>${moneyPHP(0)}</span>
          </div>
          <div class="flex justify-between text-lg">
            <span>Total</span>
            <span class="font-black grad-text" data-cc-total>${moneyPHP(subtotal)}</span>
          </div>
        </div>

        <button class="btn btn-primary w-full py-4 mt-5" type="submit">
          Place order
        </button>
        <div class="mt-3 text-white/55 text-sm" data-cc-checkout-note></div>
      </aside>
    </form>
  `;

  const form = el("[data-cc-checkout-form]", host);
  const feeNode = el("[data-cc-delivery-fee]", host);
  const totalNode = el("[data-cc-total]", host);
  const noteNode = el("[data-cc-checkout-note]", host);

  const updateTotals = () => {
    const method = form?.querySelector("input[name='fulfillment']:checked")?.value || "pickup";
    const fee = method === "delivery" ? 99 : 0;
    if (feeNode) feeNode.textContent = moneyPHP(fee);
    if (totalNode) totalNode.textContent = moneyPHP(subtotal + fee);
  };
  form?.addEventListener("change", updateTotals);
  updateTotals();

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const fulfillmentMethod = form.querySelector("input[name='fulfillment']:checked")?.value || "pickup";
    const address = String(el("#address", host)?.value || "").trim();
    if (fulfillmentMethod === "delivery" && address.length < 6) {
      if (noteNode) noteNode.textContent = "Please enter a valid delivery address.";
      return;
    }

    const cardNum = String(el("#card", host)?.value || "").replace(/\s+/g, "");
    const last4 = cardNum ? cardNum.slice(-4) : "0000";
    const paymentMethod = String(el("#method", host)?.value || "card");

    const res = placeOrder({
      fulfillment: {
        method: fulfillmentMethod,
        address: fulfillmentMethod === "delivery" ? address : null,
        pickupNote: String(el("#pickup", host)?.value || "").trim() || null,
      },
      payment: { method: paymentMethod, last4 },
    });

    if (!res.ok) {
      if (noteNode) noteNode.textContent = res.message;
      return;
    }

    if (noteNode) noteNode.textContent = `Order placed: ${res.order.id}. Redirecting…`;
    setTimeout(() => (window.location.href = "transactions.html"), 700);
  });
}

export function mountAuthPages() {
  const loginHost = el("[data-cc-login]");
  const registerHost = el("[data-cc-register]");

  if (loginHost) {
    const form = el("form", loginHost);
    const note = el("[data-cc-note]", loginHost);
    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = String(el("#email", loginHost)?.value || "").trim().toLowerCase();
      const pass = String(el("#password", loginHost)?.value || "");
      if (!email.includes("@") || pass.length < 4) {
        if (note) note.textContent = "Enter a valid email and password.";
        return;
      }
      // Prototype auth: accept any credentials, set local user.
      setUser({ id: `U-${email}`, name: email.split("@")[0], email });
      if (note) note.textContent = "Signed in. Redirecting…";
      setTimeout(() => (window.location.href = "storefront.html"), 450);
    });

    els("[data-cc-social]", loginHost).forEach((b) => {
      b.addEventListener("click", () => {
        setUser({ id: "U-social", name: "Social User", email: "social@example.com" });
        window.location.href = "storefront.html";
      });
    });
  }

  if (registerHost) {
    const form = el("form", registerHost);
    const note = el("[data-cc-note]", registerHost);
    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = String(el("#name", registerHost)?.value || "").trim();
      const email = String(el("#email", registerHost)?.value || "").trim().toLowerCase();
      const pass = String(el("#password", registerHost)?.value || "");
      if (name.length < 2 || !email.includes("@") || pass.length < 6) {
        if (note) note.textContent = "Please fill out all fields (password 6+ chars).";
        return;
      }
      setUser({ id: `U-${email}`, name, email });
      if (note) note.textContent = "Account created. Redirecting…";
      setTimeout(() => (window.location.href = "storefront.html"), 450);
    });

    els("[data-cc-social]", registerHost).forEach((b) => {
      b.addEventListener("click", () => {
        setUser({ id: "U-social", name: "Social User", email: "social@example.com" });
        window.location.href = "storefront.html";
      });
    });
  }
}

export function mountProfilePage() {
  const host = el("[data-cc-profile]");
  if (!host) return;

  const user = getUser();
  if (!user) {
    host.innerHTML = `
      <div class="surface rounded-3xl p-8 text-white/70">
        You’re browsing as a guest. <a class="link" href="login.html">Sign in</a> to view your profile.
      </div>
    `;
    return;
  }

  const orders = getOrders().filter((o) => o.user?.email === user.email);
  host.innerHTML = `
    <div class="grid lg:grid-cols-3 gap-6 items-start">
      <section class="lg:col-span-2 surface rounded-3xl p-6 md:p-8">
        <h1 class="text-2xl md:text-3xl font-black tracking-tight">Profile</h1>
        <div class="mt-5 grid sm:grid-cols-2 gap-3">
          <div class="surface-2 rounded-2xl p-4 border hairline">
            <div class="text-xs text-white/55">Name</div>
            <div class="mt-1 font-semibold">${user.name}</div>
          </div>
          <div class="surface-2 rounded-2xl p-4 border hairline">
            <div class="text-xs text-white/55">Email</div>
            <div class="mt-1 font-semibold">${user.email}</div>
          </div>
        </div>

        <div class="hairline border-t mt-6 pt-6">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-xl font-bold">Recent orders</h2>
            <a class="btn btn-ghost py-3 px-5" href="transactions.html">View all</a>
          </div>
          <div class="mt-4 space-y-3">
            ${
              orders.length === 0
                ? `<div class="text-white/65">No orders yet. <a class="link" href="storefront.html">Shop now</a>.</div>`
                : orders
                    .slice(0, 3)
                    .map(
                      (o) => `
                    <div class="surface-2 rounded-2xl p-4 border hairline">
                      <div class="flex items-center justify-between gap-3">
                        <div class="min-w-0">
                          <div class="font-semibold truncate">${o.id}</div>
                          <div class="text-white/55 text-sm">${new Date(o.createdAt).toLocaleString()}</div>
                        </div>
                        <div class="text-right">
                          <div class="chip">${o.status}</div>
                          <div class="mt-1 font-bold">${moneyPHP(o.total)}</div>
                        </div>
                      </div>
                    </div>`,
                    )
                    .join("")
            }
          </div>
        </div>
      </section>

      <aside class="surface rounded-3xl p-6 md:p-8">
        <h2 class="text-xl font-bold">Settings</h2>
        <p class="mt-2 text-white/65 text-sm">Prototype settings — stored locally for demo purposes.</p>
        <button class="btn btn-ghost w-full py-4 mt-5" type="button" data-cc-logout>Sign out</button>
      </aside>
    </div>
  `;

  el("[data-cc-logout]", host)?.addEventListener("click", () => {
    logout();
    window.location.href = "index.html";
  });
}

export function mountTransactionsPage() {
  const host = el("[data-cc-transactions]");
  if (!host) return;

  const user = getUser();
  if (!user) {
    host.innerHTML = `
      <div class="surface rounded-3xl p-8 text-white/70">
        Please <a class="link" href="login.html">sign in</a> to view your transaction history.
      </div>
    `;
    return;
  }

  const orders = getOrders().filter((o) => o.user?.email === user.email);
  host.innerHTML = `
    <div class="surface rounded-3xl p-6 md:p-8">
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 class="text-2xl md:text-3xl font-black tracking-tight">Transaction history</h1>
          <p class="mt-2 text-white/65">Orders placed on this device (local demo storage).</p>
        </div>
        <a class="btn btn-primary py-3 px-6" href="storefront.html">Shop more</a>
      </div>

      <div class="hairline border-t mt-6 pt-6 space-y-4">
        ${
          orders.length === 0
            ? `<div class="text-white/70">No orders yet. Checkout when you’re ready.</div>`
            : orders
                .map((o) => {
                  const itemsLine = (o.items || []).map((i) => `${i.qty}× ${i.name}`).join(", ");
                  return `
                    <article class="surface-2 rounded-2xl p-5 border hairline">
                      <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div class="min-w-0">
                          <div class="flex flex-wrap gap-2 items-center">
                            <div class="font-semibold">${o.id}</div>
                            <span class="chip">${o.status}</span>
                            <span class="chip">${o.fulfillment?.method === "delivery" ? "Delivery" : "Pickup"}</span>
                          </div>
                          <div class="text-white/55 text-sm mt-1">${new Date(o.createdAt).toLocaleString()}</div>
                          <div class="text-white/70 text-sm mt-3">
                            <span class="text-white/55">Items:</span> ${itemsLine}
                          </div>
                          <div class="text-white/60 text-sm mt-2">
                            Payment: <span class="text-white/75">${o.payment?.method}</span> •
                            Receipt: <span class="text-white/75">•••• ${o.payment?.last4}</span>
                          </div>
                        </div>
                        <div class="text-right">
                          <div class="text-white/55 text-sm">Total</div>
                          <div class="text-2xl font-extrabold grad-text">${moneyPHP(o.total)}</div>
                        </div>
                      </div>
                    </article>
                  `;
                })
                .join("")
        }
      </div>
    </div>
  `;
}

export function initPage() {
  mountGlobalNav();
  mountFooter();
  mountScrollReveal();
  mountCatalogGrid();
  mountProductPage();
  mountCartPage();
  mountCheckoutPage();
  mountAuthPages();
  mountProfilePage();
  mountTransactionsPage();
}