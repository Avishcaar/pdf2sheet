import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function useInvoices() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['invoices'],
        queryFn: async () => {
            const response = await api.get('/invoices');
            return response.data.data;
        },
        staleTime: 2000,
        refetchInterval: 5000, // Background fallback polling
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        let eventSource = null;

        try {
            eventSource = new EventSource(`${baseUrl}/invoices/stream?token=${token}`);

            eventSource.addEventListener('INVOICE_INGESTED', (event) => {
                try {
                    const payload = JSON.parse(event.data);
                    const inv = payload.data?.invoice || payload.data;
                    const vendor = inv?.vendorName || 'New Invoice';
                    const amount = inv?.extractedData?.totalAmount || inv?.totalAmount || '';
                    const currency = inv?.extractedData?.currency || inv?.currency || '$';

                    toast.success(`Live Ingestion: Ingested invoice from "${vendor}" (${currency} ${amount})!`, {
                        duration: 5000
                    });

                    // Instantly update UI without waiting for poll interval
                    queryClient.invalidateQueries({ queryKey: ['invoices'] });
                } catch (e) {
                    queryClient.invalidateQueries({ queryKey: ['invoices'] });
                }
            });

            eventSource.onerror = () => {
                // EventSource auto-reconnects automatically
            };
        } catch (err) {
            console.warn('[SSE] EventSource init note:', err.message);
        }

        return () => {
            if (eventSource) {
                eventSource.close();
            }
        };
    }, [queryClient]);

    return query;
}
