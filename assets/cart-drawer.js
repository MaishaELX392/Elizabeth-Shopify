
document.addEventListener('DOMContentLoaded', () => {
  let drawer = document.querySelector('[data-cart-drawer]');

  if (!drawer) return;

  const closeDrawer = () => {
    drawer.classList.remove('is-open');
    document.body.classList.remove('cart-drawer-open');
  };

  const updateCartItem = async (line, quantity) => {
    try {
      const response = await fetch('/cart/change.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({ line, quantity })
      });

      if (!response.ok) {
        throw new Error('Failed to update cart');
      }

      await response.json();
      document.dispatchEvent(new CustomEvent('cart:updated'));
    } catch (error) {
      console.error(error);
    }
  };

  const clearCart = async () => {
    try {
      const response = await fetch('/cart/clear.js', {
        method: 'POST',
        headers: {
          Accept: 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to clear cart');
      }

      await response.json();
      document.dispatchEvent(new CustomEvent('cart:updated'));
    } catch (error) {
      console.error(error);
    }
  };

  const updateCartDrawer = async (open = false) => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('sections', 'cart-drawer');

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to update cart drawer');
      }

      const sections = await response.json();
      const html = new DOMParser().parseFromString(
        sections['cart-drawer'],
        'text/html'
      );
      const newDrawer = html.querySelector('[data-cart-drawer]');

      if (!newDrawer) return;

      if (open) {
        newDrawer.classList.add('is-open');
      }

      drawer.replaceWith(newDrawer);
      drawer = newDrawer;

      if (open) {
        document.body.classList.add('cart-drawer-open');
      }

      const cartResponse = await fetch('/cart.js');
      const cart = await cartResponse.json();
      const cartCount = document.querySelector('[data-cart-count]');

      if (cartCount) {
        cartCount.textContent = cart.item_count;
      }
    } catch (error) {
      console.error(error);
    }
  };

  document.addEventListener('click', (event) => {
    const button = event.target.closest(
      '[data-cart-close], [data-quantity-minus], [data-quantity-plus], [data-cart-remove], [data-clear-cart]'
    );

    if (!button || !drawer.contains(button)) return;

    if (button.matches('[data-cart-close]')) {
      closeDrawer();
      return;
    }

    if (button.matches('[data-clear-cart]')) {
      clearCart();
      return;
    }

    const item = button.closest('[data-cart-item]');

    if (!item) return;

    const line = item.dataset.line;

    if (button.matches('[data-cart-remove]')) {
      updateCartItem(line, 0);
      return;
    }

    const quantity = Number(
      item.querySelector('[data-cart-quantity]').value
    );

    if (button.matches('[data-quantity-minus]')) {
      updateCartItem(line, quantity - 1);
      return;
    }

    if (button.matches('[data-quantity-plus]')) {
      updateCartItem(line, quantity + 1);
    }
  });

  document
    .querySelector('[data-cart-trigger]')
    ?.addEventListener('click', async (event) => {
      event.preventDefault();
      await updateCartDrawer(true);
    });

  document.addEventListener('cart:updated', () => {
    updateCartDrawer(true);
  });
});


