import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getInvoices, getInvoice, getInvoicePdf, processAndLearn, deleteInvoice, updateInvoice } from '../controllers/invoiceController.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getInvoices);
router.get('/:id/pdf', getInvoicePdf);
router.get('/:id', getInvoice);
router.put('/:id', updateInvoice);
router.post('/:id/process', authenticateToken, processAndLearn);
router.delete('/:id', authenticateToken, deleteInvoice);

export default router;
