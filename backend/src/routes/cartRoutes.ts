import { Router, Request, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/firebaseAuth.js';
import {
  getCart,
  addOrUpdateCartItem,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
} from '../services/cartService.js';

const router = Router();

router.use(requireAuth);

// GET /api/cart — fetch the logged-in user's cart
router.get('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const items = await getCart(userId);
    return res.json({ success: true, items });
  } catch (error) {
    console.error('❌ Get cart error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch cart' });
  }
});

// POST /api/cart — add item (increments quantity if already in cart)
router.post('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const item = req.body;

    if (!item.id || !item.name || item.price === undefined || !item.quantity) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: id, name, price, quantity',
      });
    }

    const items = await addOrUpdateCartItem(userId, item);
    return res.json({ success: true, items });
  } catch (error) {
    console.error('❌ Add cart item error:', error);
    return res.status(500).json({ success: false, error: 'Failed to add item to cart' });
  }
});

// DELETE /api/cart/clear — remove all items (must come before /:docId)
router.delete('/clear', async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    await clearCart(userId);
    return res.json({ success: true, items: [] });
  } catch (error) {
    console.error('❌ Clear cart error:', error);
    return res.status(500).json({ success: false, error: 'Failed to clear cart' });
  }
});

// PUT /api/cart/:docId — update quantity for a specific item
router.put('/:docId', async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { docId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined || typeof quantity !== 'number') {
      return res.status(400).json({ success: false, error: 'quantity (number) is required' });
    }

    const items = await updateCartItemQuantity(userId, docId, quantity);
    return res.json({ success: true, items });
  } catch (error) {
    console.error('❌ Update cart item error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update cart item' });
  }
});

// DELETE /api/cart/:docId — remove a specific item
router.delete('/:docId', async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { docId } = req.params;

    const items = await removeCartItem(userId, docId);
    return res.json({ success: true, items });
  } catch (error) {
    console.error('❌ Remove cart item error:', error);
    return res.status(500).json({ success: false, error: 'Failed to remove cart item' });
  }
});

export default router;
