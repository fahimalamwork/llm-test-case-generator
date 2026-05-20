# Shopping cart

As a shopper, I want to add and remove items in my cart so I can review my
selection before checking out.

The inventory page lists products with an "Add to cart" button. The cart icon
in the header shows a badge with the current item count. The cart page shows
each item with quantity, unit price, line total, and a Remove button.

## Acceptance Criteria

- Clicking "Add to cart" increments the header badge by one.
- The cart page lists every item that was added, in insertion order.
- Clicking Remove on a line removes it immediately and decrements the badge.
- The badge disappears when the cart is empty.
- Quantity is capped at ten per line; the increment button is disabled at ten.
