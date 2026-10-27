import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { 
    getInvoices, 
    getInvoice, 
    getInvoicePdf, 
    processAndLearn, 
    deleteInvoice, 
    clearAllInvoices,
    updateInvoice,
    askInvoice,
    getCFOExecutiveBrief,
    parseInvoiceQueryNL
} from '../controllers/invoiceController.js';
import { addSSEClient } from '../services/sseService.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    if (res.flushHeaders) res.flushHeaders();
    addSSEClient(res);
});

router.get('/', getInvoices);
router.post('/cfo-brief', getCFOExecutiveBrief);
router.post('/nl-query', parseInvoiceQueryNL);
router.get('/:id/pdf', getInvoicePdf);
router.get('/:id', getInvoice);
router.put('/:id', updateInvoice);
router.post('/:id/process', processAndLearn);
router.post('/:id/ask', askInvoice);
router.delete('/all', clearAllInvoices);
router.delete('/:id', deleteInvoice);

export default router;
