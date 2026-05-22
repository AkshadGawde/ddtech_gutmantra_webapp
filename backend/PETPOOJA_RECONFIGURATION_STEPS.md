# 📋 PetPooja POS Reconfiguration - Step-by-Step Guide

## Overview
**Goal:** Convert items from EID-based pricing to standard variations so prices sync to the website  
**Items to fix:** 6 spices + 5 multigrain blends (11 items total)  
**Time per item:** ~5 minutes  
**Total time:** ~1 hour for all items

---

## Why This Fixes It

**Current setup (BROKEN):**
```
Dhaniya (Spice)
├── EID pricing: V1288602363 (₹90), V1288602364 (₹50)
└── Standard variations: EMPTY ❌
    → PetPooja doesn't send prices to website
```

**Target setup (FIXED):**
```
Dhaniya (Spice)
├── Standard variations: "Quantity" group
│   ├── 50 Gram (₹50)
│   ├── 100 Gram (₹90)
└── Prices sync to website via push_menu API ✅
```

---

## Step-by-Step Instructions

### STEP 1: Login to PetPooja POS
1. Go to: https://pos.petpooja.com (or your PetPooja POS URL)
2. Login with your credentials
3. Select your restaurant location

---

### STEP 2: Navigate to Menu Items
**Path:** Menu → Items (or Products)

1. Click **"Menu"** in sidebar
2. Click **"Items"** 
3. Search for first item: **"Dhaniya"**
4. Click to open the item details page

---

### STEP 3: Remove EID-Based Pricing

**IMPORTANT:** First, we need to REMOVE the old EID-based setup.

On the item details page:

1. Look for section: **"Item Information"** or **"Pricing"**
2. Find the table showing:
   ```
   EID: V1288602363 | Price: ₹90
   EID: V1288602364 | Price: ₹50
   ```
3. For EACH row:
   - Click the **trash/delete icon** on the right
   - Confirm delete
4. Once both EID rows are deleted, this section should be empty

**Example location:** Usually under "Item Variations" or "Area Pricing" tab

---

### STEP 4: Add Standard Variations

Now add variations using PetPooja's standard variation system:

1. Find section: **"Variations"** (might be in a tab labeled "Variations" or "Portions")

2. Click **"Add Variation"** or **"+ Variation"** button

3. For **FIRST VARIATION:**
   - **Variation Group:** Select **"Quantity"** (dropdown)
     - *If "Quantity" doesn't exist, create it:*
       - Click "Create New Group" 
       - Name: "Quantity"
       - Type: "Quantity/Size"
       - Save
   
   - **Variation Name:** Enter **"50 Gram"**
   - **Price:** Enter **"50"** (just the number, no rupee symbol)
   - **Status:** Set to **"Active"**
   - Click **"Save"** or **"Add"**

4. For **SECOND VARIATION:**
   - Click **"Add Variation"** again
   - **Variation Group:** **"Quantity"** (same group)
   - **Variation Name:** Enter **"100 Gram"**
   - **Price:** Enter **"90"**
   - **Status:** Set to **"Active"**
   - Click **"Save"** or **"Add"**

**Result should show:**
```
Variations
├── 50 Gram - ₹50 ✅
└── 100 Gram - ₹90 ✅
```

---

### STEP 5: Verify & Save Item

1. Scroll up and review the item details:
   - **Name:** Dhaniya ✅
   - **Category:** Homemade Spices ✅
   - **Base Price:** Can be 0 (variations will override) ✅
   - **Variations:** 50 Gram, 100 Gram with prices ✅

2. Look for button: **"Save"** or **"Update"**
3. Click to save all changes

**Wait for success message:** "Item updated successfully" ✅

---

### STEP 6: Push Menu to Website

After saving the item:

1. Look for button: **"Push Menu"** or **"Sync Menu"** (usually top right)
2. Click **"Push Menu"**
3. **Wait for completion** (2-5 minutes)
4. You'll see: "Menu pushed successfully" ✅

**This sends updated pricing to your website!**

---

### STEP 7: Repeat for All 11 Items

Go back to Step 2 and repeat for each item:

**SPICES (6 items):**
- [ ] Dhaniya (50 Gram = ₹50, 100 Gram = ₹90)
- [ ] Turmeric (50 Gram = ₹?, 100 Gram = ₹?)
- [ ] Red Chili Powder (50 Gram = ₹?, 100 Gram = ₹?)
- [ ] Garam Masala (50 Gram = ₹?, 100 Gram = ₹?)
- [ ] Kanda Lahsun (50 Gram = ₹?, 100 Gram = ₹?)
- [ ] Goda Masala (50 Gram = ₹?, 100 Gram = ₹?)

**MULTIGRAIN BLENDS (5 items):**
- [ ] High Protein Multigrain (500g = ₹?, 1kg = ₹?)
- [ ] Sugarless Multigrain (500g = ₹?, 1kg = ₹?)
- [ ] Gluten Free Multigrain (500g = ₹?, 1kg = ₹?)
- [ ] Little Champ Multigrain (500g = ₹?, 1kg = ₹?)
- [ ] Weight Control (500g = ₹?, 1kg = ₹?)

**For each item:**
1. Find it in Menu → Items
2. Remove old EID pricing (delete those rows)
3. Add variations with prices
4. Save
5. Go to next item

---

## Finding Correct Prices

If you don't remember the exact prices for each variant, check in PetPooja:

**Method 1: Check PetPooja Dashboard**
1. Go to Menu → Items
2. Click item → "Area Pricing" tab
3. Look for prices by area (e.g., "Home Delivery")
4. Note down the prices

**Method 2: Check Your Original Data**
You showed earlier:
```
Dhaniya:
├── 50 gram: ₹50
├── 100 gram: ₹90

Turmeric: (similar structure)
```

---

## After Completing All Items

### Final Step: Full Menu Push

1. Go to **Menu** → **Push Menu** (or **Sync**)
2. Select **"All Items"** or **"Full Menu"**
3. Click **"Push Menu"**
4. **Wait for completion** (5-10 minutes)
5. See: "Menu pushed successfully" ✅

### Verify on Website

1. Open: https://gutmantra.in (your website)
2. Search for **"Dhaniya"**
3. You should see:
   ```
   Dhaniya
   ₹50 – ₹90
   
   [50 Gram - ₹50] [100 Gram - ₹90]
   ```
4. Click "Add to Cart" → Should work ✅

---

## Troubleshooting

### Issue: "Can't find Variations section"
**Solution:** 
- Look for tabs: "Details", "Variations", "Pricing", "Areas"
- Click the **"Variations"** tab
- Should be in that tab

### Issue: "Quantity group doesn't exist"
**Solution:**
- Don't panic, create it:
  1. In Variations section, look for "Create New Group" or "+"
  2. Name it: "Quantity"
  3. Type: "Quantity" or "Size"
  4. Save
  5. Then use it for variations

### Issue: "Price not appearing after save"
**Solution:**
- Make sure you clicked **"Push Menu"** button
- Wait 5-10 minutes for sync
- Refresh website
- If still not showing, check:
  1. Price was entered correctly (no rupee symbol)
  2. Variation status is "Active"
  3. Item status is "Active"

### Issue: "Website still shows ₹0"
**Solution:**
- Check PetPooja logs (usually under "Sync" or "History")
- Click item, verify variations still there
- Do "Push Menu" again
- Wait 10 minutes
- Refresh website with Cmd+Shift+R (hard refresh)

---

## Quick Reference - What Each Section Does

| Section | What to Do | Why |
|---------|-----------|-----|
| Item Information | Review (don't change unless needed) | Confirms item name & category |
| Pricing | DELETE old EID rows | Remove broken pricing |
| Variations | ADD new variations with prices | Enable price sync to website |
| Status | Set to "Active" | Item must be active to sync |
| Save | Click when done | Save all changes |
| Push Menu | Click after saving | Send prices to website |

---

## Timeline

```
Item 1 (Dhaniya):        5-10 min
Item 2 (Turmeric):       5-10 min
Item 3 (Red Chili):      5-10 min
Item 4 (Garam Masala):   5-10 min
Item 5 (Kanda Lahsun):   5-10 min
Item 6 (Goda Masala):    5-10 min
Items 7-11 (Multigrain): 25-50 min

Full Menu Push:          10 min
Website verification:    5 min

TOTAL: ~1.5 hours
```

---

## Video Guide (If Needed)

If you get stuck, PetPooja has video tutorials:
1. Search in PetPooja Help: "Adding Variations"
2. Or email: support@petpooja.com
3. Ask: "How to add standard variations to items?"

---

## Confirmation Checklist

After completing ALL items and pushing menu:

```
[ ] All 6 spices have 2 variations each (50g, 100g)
[ ] All 5 multigrain items have variations configured
[ ] Old EID pricing removed from all items
[ ] All items set to "Active"
[ ] Full menu pushed successfully
[ ] Website refreshed (hard refresh: Cmd+Shift+R)
[ ] Website shows prices (not ₹0)
[ ] Can add to cart successfully
[ ] Prices appear in checkout
```

---

## After Confirming Everything Works

Once website shows prices correctly:

1. **Celebrate!** 🎉 All items now syncing properly
2. **Monitor** for 24 hours to ensure stability
3. **Test** a full order flow with variant selection
4. **Go live** with confidence

---

## Support

If you get completely stuck:
1. **PetPooja Support:** support@petpooja.com
2. **Your Account Manager:** (contact info)
3. **Screenshot the error** and share with them

---

**Ready? Start with Dhaniya and follow the steps above!** 📋

Good luck! This will fix all the pricing issues. ✅

