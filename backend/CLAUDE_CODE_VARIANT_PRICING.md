# 🛠️ Claude Code Prompt: Fix Variant-Based Pricing for Spices & Multi-grain Atta

## Task Overview
Fix product pricing display and variant selection for products that have **zero base price** but have **actual prices in variants** (like spices: 100gm=₹90, 50gm=₹50).

**Current Issue:** Shows ₹0 for these products  
**Required:** Display variant prices and let users select variant (100gm, 50gm, etc.)

---

## Database Structure Analysis

### Product Level:
```
Spices Product (e.g., "Dhaniya"):
{
  sku: "127066663",
  name: "Dhaniya",
  price: 0,  ← BASE PRICE IS 0
  variants: [
    {
      name: "100 gram",
      petpoojaId: "V1288602363",
      price: 90  ← ACTUAL PRICE HERE
    },
    {
      name: "50 gram", 
      petpoojaId: "V1288602364",
      price: 50  ← ACTUAL PRICE HERE
    }
  ]
}
```

### Affected Products:
- ❌ Dhaniya (100gm=90, 50gm=50)
- ❌ All handmade spices with variants
- ❌ Some multi-grain atta with variants
- ✅ Other products with base price (work fine)

---

## Required Changes

### Fix #1: Frontend - Product Display (ProductPage.tsx)
**File:** `src/pages/ProductPage.tsx`

**Current Logic:**
```typescript
// Shows base price even if 0
const displayPrice = product.price;
// Don't show variant options if price = 0
```

**Required Logic:**
```typescript
// If base price is 0 and has variants, use variant prices
const displayPrice = product.price === 0 && product.variants?.length > 0
  ? Math.min(...product.variants.map(v => v.price))  // Show minimum variant price
  : product.price;

// Show variant selector ONLY if:
// - Product has multiple variants, OR
// - Base price is 0 but variants have prices
const showVariantSelector = product.variants?.length > 1 || 
  (product.price === 0 && product.variants?.length > 0);
```

**Expected UI Change:**
```
Before: ₹0 (no variant selector)
After:  ₹50 - ₹90 (with variant selector showing 100gm, 50gm options)
```

---

### Fix #2: Frontend - Cart Logic (CartContext.tsx / useCart hook)
**File:** `src/context/CartContext.ts` OR `src/hooks/useCart.ts`

**Current Logic:**
```typescript
// Adds item with base price
const addToCart = (product) => {
  cart.push({
    ...product,
    price: product.price,  // 0 for spices!
  });
};
```

**Required Logic:**
```typescript
const addToCart = (product, selectedVariant = null) => {
  // If product has 0 base price but variant selected
  if (product.price === 0 && selectedVariant) {
    cart.push({
      ...product,
      price: selectedVariant.price,      // Use variant price
      selectedVariant: selectedVariant.name,  // Remember "100gm" or "50gm"
      petpoojaId: selectedVariant.petpoojaId,  // Use variant petpooja ID
    });
  } else if (product.price === 0 && product.variants?.length > 0) {
    // If no variant selected but base price is 0, use cheapest variant
    const cheapestVariant = product.variants.reduce((min, v) => 
      v.price < min.price ? v : min
    );
    cart.push({
      ...product,
      price: cheapestVariant.price,
      selectedVariant: cheapestVariant.name,
      petpoojaId: cheapestVariant.petpoojaId,
    });
  } else {
    // Normal flow - use base price
    cart.push({
      ...product,
      price: product.price,
    });
  }
};
```

---

### Fix #3: Frontend - Add to Cart Button Component
**File:** `src/components/ProductCard.tsx` OR wherever "Add to Cart" is

**Current Logic:**
```typescript
<button onClick={() => addToCart(product)}>
  Add to Cart
</button>
```

**Required Logic:**
```typescript
const [selectedVariant, setSelectedVariant] = useState(null);

// Show variant selector if needed
{(product.price === 0 && product.variants?.length > 0) && (
  <div className="variant-selector mb-4">
    <label className="text-sm font-semibold mb-2 block">
      Select {product.name} weight:
    </label>
    <div className="flex gap-3">
      {product.variants.map(variant => (
        <button
          key={variant.petpoojaId}
          onClick={() => setSelectedVariant(variant)}
          className={`px-4 py-2 rounded border ${
            selectedVariant?.petpoojaId === variant.petpoojaId
              ? 'border-primary bg-primary/10'
              : 'border-gray-300'
          }`}
        >
          {variant.name} - ₹{variant.price}
        </button>
      ))}
    </div>
  </div>
)}

<button 
  onClick={() => addToCart(product, selectedVariant)}
  disabled={product.price === 0 && !selectedVariant}  // Require variant selection
>
  Add to Cart
</button>
```

---

### Fix #4: Frontend - Checkout Display (CheckoutPage.tsx)
**File:** `src/pages/CheckoutPage.tsx`

**When displaying cart items, show selected variant:**
```typescript
items.map(item => (
  <div key={item.petpoojaId} className="cart-item">
    <span>{item.name}</span>
    {item.selectedVariant && (
      <span className="text-sm text-gray-500">({item.selectedVariant})</span>
    )}
    <span>₹{item.price}</span>
  </div>
))
```

---

### Fix #5: Backend - Order Creation (paymentController.ts)
**File:** `src/controllers/paymentController.ts` - createOrder function

**When sending to PetPooja, use variant petpoojaId:**
```typescript
const formattedItems = items.map((item: any) => ({
  base_id: item.base_id || item.sku || item.petpoojaId,
  variation_id: item.variation_id || item.selectedVariant || "",
  petpoojaId: item.petpoojaId,  // Use stored petpooja ID from variant
  name: item.name,
  price: String(item.price),    // Use actual price (from variant)
  quantity: String(item.quantity),
}));
```

---

### Fix #6: Backend - Product Service (productService.ts)
**File:** `src/services/productService.ts` (if you have one)

**When fetching products, ensure variants are included:**
```typescript
export async function getProductWithVariants(productId: string) {
  const product = await fetchFromPetpooja(`/products/${productId}`);
  
  // Ensure variants are properly formatted
  if (product.variants && product.price === 0) {
    return {
      ...product,
      variants: product.variants.map(v => ({
        name: v.name,
        price: v.price,
        petpoojaId: v.petpoojaId || v.eid,
        grind: v.grind || null,
      })),
    };
  }
  
  return product;
}
```

---

## What NOT to Change

❌ **Don't modify:**
- Regular product pricing (base_id with fixed price)
- Variant selection for products with base price > 0
- COD payment logic
- Payment gateway integration
- Order status tracking
- Any other product categories

✅ **Only affect:**
- Products where: `base_price = 0` AND `variants.length > 0`
- Display logic to show variant prices
- Cart logic to handle variant selection
- Checkout to display selected variant

---

## Testing Checklist

After Claude Code implements fixes:

### Test Case 1: Spices with Variants
```
1. Open ProductPage for "Dhaniya"
2. Verify shows: "₹50 - ₹90" (not ₹0)
3. Verify variant selector shows: [100 gram - ₹90] [50 gram - ₹50]
4. Select "100 gram" variant
5. Click "Add to Cart"
6. Verify cart shows item with selected variant
7. Go to checkout
8. Verify displays: "Dhaniya (100 gram) - ₹90"
9. Proceed to payment
10. Complete payment
11. Verify PetPooja receives order with correct variant petpoojaId and price ✅
```

### Test Case 2: Regular Products (Should Unchanged)
```
1. Open ProductPage for "Kanak - Multigrain Atta" (with base price)
2. Verify shows base price correctly
3. If has variants, variant selector should work as before
4. Add to cart, verify price is correct
5. Checkout works as before ✅
```

### Test Case 3: Free Products (Should Work)
```
1. Products with price = 0 and NO variants
2. Should still show as ₹0 or "Free"
3. Should allow adding to cart ✅
```

### Test Case 4: Cart Calculations
```
1. Add spice (50gm = ₹50) qty 2 = ₹100
2. Add spice (100gm = ₹90) qty 1 = ₹90
3. Subtotal = ₹190
4. Verify calculation is correct
5. Add delivery charge
6. Verify final amount correct ✅
```

---

## Files to Check/Modify

| File | Current Status | Change Type |
|------|---|---|
| `src/pages/ProductPage.tsx` | ❌ Shows ₹0 | Fix pricing display |
| `src/context/CartContext.ts` | ❌ Missing variant handling | Add variant logic |
| `src/components/ProductCard.tsx` | ❌ No variant selector | Add UI |
| `src/pages/CheckoutPage.tsx` | ⚠️ Partial | Display variant info |
| `src/controllers/paymentController.ts` | ⚠️ Partial | Use variant petpoojaId |
| `src/services/productService.ts` | ✅ OK | Check variant format |

---

## Expected Result

### Before Fix:
```
Product: Dhaniya
Price: ₹0
Add to Cart button (doesn't work well)
Cart shows: Dhaniya - ₹0
Subtotal: ₹0 ❌
```

### After Fix:
```
Product: Dhaniya
Price: ₹50 - ₹90
Variant selector: [100 gram - ₹90] [50 gram - ₹50]
Select 100 gram → Add to Cart
Cart shows: Dhaniya (100 gram) - ₹90
Subtotal: ₹90 ✅
PetPooja order gets: correct petpoojaId, correct price ✅
```

---

## Implementation Notes

### Priority:
1. **CRITICAL:** ProductPage display (Fix #1)
2. **CRITICAL:** Cart logic (Fix #2)
3. **HIGH:** Variant selector UI (Fix #3)
4. **HIGH:** Checkout display (Fix #4)
5. **MEDIUM:** Backend order creation (Fix #5)

### Non-Breaking Changes:
- All changes are additive
- Regular products unaffected
- Only affects products with `price = 0` AND `variants.length > 0`
- Backward compatible

### Error Handling:
- If user clicks "Add to Cart" without selecting variant → Show error: "Please select a weight/size"
- If variant data malformed → Fall back to base price
- If no variants exist → Work as before

---

## Claude Code Prompt

When you run Claude Code, use this prompt:

```
I need you to fix variant-based pricing for products that have zero base price 
but have actual prices in variants (like spices: 100gm=₹90, 50gm=₹50).

Current issue: Shows ₹0, no variant selector

Required changes:
1. ProductPage.tsx - Show minimum variant price, add variant selector
2. CartContext/useCart - Handle variant selection in cart
3. ProductCard - Add variant selector UI before "Add to Cart"
4. CheckoutPage - Display selected variant in cart items
5. paymentController - Use variant petpoojaId when creating orders

Database structure:
- Products with price=0 have variants with prices
- Variants have: name (100gm, 50gm), price (₹90, ₹50), petpoojaId

Don't break:
- Regular product pricing (items with base price > 0)
- Payment logic
- Order tracking
- Other product categories

Test with: Dhaniya spice (100gm=₹90, 50gm=₹50)
Expected: Show ₹50-₹90, select variant, add to cart with correct price

Files to modify:
- src/pages/ProductPage.tsx
- src/context/CartContext.ts (or src/hooks/useCart.ts)
- src/components/ProductCard.tsx
- src/pages/CheckoutPage.tsx
- src/controllers/paymentController.ts
```

---

## Quick Reference - Affected Products

**Check in your Firestore/PetPooja:**
```
Products with price = 0:
- All under "Homemade Spices"
- Some under "Multi-grain Atta" 
- Check for variants in each

Products to test:
1. Dhaniya (100gm, 50gm)
2. Other spices with similar structure
3. Any multi-grain atta with variants
```

---

**Status:** 🟠 READY FOR IMPLEMENTATION  
**Complexity:** Medium (affects UI + cart + checkout)  
**Risk:** Low (only affects specific product type)  
**Time Estimate:** 2-3 hours with Claude Code

