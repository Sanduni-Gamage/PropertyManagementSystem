import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { sendMessage } from '../../slices/messagesSlice';

interface Props {
  type: 'tour' | 'apply' | 'question';
  conversationId: string;
  onClose: () => void;
}
export default function MessageModal({ type, conversationId, onClose }: Props) {
  const auth = useAppSelector(s => s.auth);
  const dispatch = useAppDispatch();
  const [phone, setPhone] = useState('');
  const [content, setContent] = useState(
    type === 'tour' ? 'I would like to schedule a tour.' :
    type === 'apply' ? 'I am interested in applying for this property.' : 'I have a question about this property.'
  );
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await dispatch(sendMessage({ conversationId, content, type, name: auth.user?.email || '', email: auth.user?.email, phone })).unwrap();
      onClose();
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-md p-6 rounded">
        <button className="absolute right-4 top-4" onClick={onClose}>✕</button>
        <h3 className="text-lg font-semibold mb-3">{type === 'tour' ? 'Request a tour' : type === 'apply' ? 'Request to apply' : 'Ask a question'}</h3>
        <form onSubmit={submit} className="flex flex-col gap-2">
          <input name="email" value={auth.user?.email || ''} disabled className="border p-2 rounded bg-gray-100" />
          <input name="phone" value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="Phone" className="border p-2 rounded" />
          <textarea value={content} onChange={(e)=>setContent(e.target.value)} rows={5} className="border p-2 rounded" />
          <button type="submit" disabled={loading} className="bg-blue-600 text-white p-2 rounded">
            {loading ? 'Sending...' : type === 'tour' ? 'Send tour request' : 'Send message'}
          </button>
        </form>
      </div>
    </div>
  );
}
