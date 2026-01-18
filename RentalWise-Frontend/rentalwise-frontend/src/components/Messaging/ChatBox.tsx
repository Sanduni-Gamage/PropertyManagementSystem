import React, { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchMessages, sendMessage, fetchConversationByProperty, startConversation, setActiveConversation, receiveMessage } from '../../slices/messagesSlice';
import { startSignalR, stopSignalR } from '../../services/messaging/signalRService';
import MessageModal from '../UI/MessageModal';

export default function ChatBox({ conversationId }: { conversationId: string }) {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(s => s.auth);
  const chat = useAppSelector(s => s.messages);
  const [text, setText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // start signalr
    if (auth.token) {
      startSignalR(auth.token, (m) => dispatch(receiveMessage(m))).catch(console.error);
    }
    return () => { stopSignalR(); };
  }, [auth.token]);

  useEffect(() => {
    if (conversationId) {
      dispatch(fetchMessages(conversationId));
      // set active conversation in store for other UIs
      dispatch(setActiveConversation({ id: conversationId, propertyId: undefined, landlordId: undefined, tenantId: undefined, createdAt: new Date().toISOString() }));
    }
  }, [conversationId, dispatch]);

  useEffect(() => {
    // scroll to bottom
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chat.items]);

  const onSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;
    try {
      await dispatch(sendMessage({ conversationId, content: text, type: 'text', name: auth.user?.email || '', email: auth.user?.email })).unwrap();
      setText('');
    } catch (err) { console.error(err); }
  };

  return (
    <div className="border rounded p-4 max-w-2xl">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-semibold">Conversation</h4>
        <div className="flex gap-2">
          <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-3 py-1 rounded">Message Landlord</button>
        </div>
      </div>

      <div ref={scrollRef} className="h-64 overflow-y-auto border p-2 space-y-2">
        {chat.items.length === 0 ? <div className="text-gray-500">No messages yet</div> : chat.items.map(m => (
          <div key={m.id} className={`p-2 rounded ${m.senderId === auth.user?.id ? 'bg-blue-50 self-end' : 'bg-gray-100'}`}>
            <div className="text-sm text-gray-700">{m.content}</div>
            <div className="text-xs text-gray-400 mt-1">{new Date(m.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>

      <form onSubmit={onSend} className="mt-3 flex gap-2">
        <input className="flex-1 border p-2 rounded" value={text} onChange={(e)=>setText(e.target.value)} placeholder="Write a message..." />
        <button className="bg-green-600 text-white px-3 rounded" type="submit">Send</button>
      </form>

      {showModal && conversationId && (
        <MessageModal type="tour" conversationId={conversationId} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
