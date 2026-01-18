import api from "../api";

export interface MessageCreateDto {
  propertyId: number;
  type: "tour" | "apply" | "question";
  name: string;
  email: string;
  phone: string;
  content: string;
}

export async function sendMessage(dto: MessageCreateDto) {
  const res = await api.post("/messages", dto);
  return res.data;
}

export async function fetchMessages(propertyId: number) {
  const res = await api.get(`/messages?propertyId=${propertyId}`);
  return res.data; // expected array
}
