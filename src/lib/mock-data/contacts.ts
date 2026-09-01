import { Contact } from "@/lib/types";

export const contacts: Contact[] = [
  // Padaria Pão Nosso
  { id: "paonosso-contact-1", companyId: "company-paonosso", name: "Mercado Central Atacado", type: "supplier", document: "11.222.333/0001-44", email: "compras@mercadocentral.com.br", phone: "(11) 3456-7890" },
  { id: "paonosso-contact-2", companyId: "company-paonosso", name: "Distribuidora de Farinhas SP", type: "supplier", document: "22.333.444/0001-55", email: "vendas@farinhassp.com.br", phone: "(11) 3456-1234" },
  { id: "paonosso-contact-3", companyId: "company-paonosso", name: "Café Bom Dia Ltda", type: "client", document: "33.444.555/0001-66", email: "financeiro@cafebomdia.com.br", phone: "(11) 98765-4321" },
  { id: "paonosso-contact-4", companyId: "company-paonosso", name: "Buffet Doce Encontro", type: "client", document: "44.555.666/0001-77", email: "contato@doceencontro.com.br", phone: "(11) 98888-1122" },

  // Oficina Mecânica Rota Certa
  { id: "rotacerta-contact-1", companyId: "company-rotacerta", name: "Auto Peças Nacional", type: "supplier", document: "55.666.777/0001-88", email: "vendas@autopecasnacional.com.br", phone: "(21) 3344-5566" },
  { id: "rotacerta-contact-2", companyId: "company-rotacerta", name: "Distribuidora de Óleos Lubrimax", type: "supplier", document: "66.777.888/0001-99", email: "comercial@lubrimax.com.br", phone: "(21) 3344-7788" },
  { id: "rotacerta-contact-3", companyId: "company-rotacerta", name: "Transportadora Veloz", type: "client", document: "77.888.999/0001-10", email: "frota@transveloz.com.br", phone: "(21) 99999-2233" },
  { id: "rotacerta-contact-4", companyId: "company-rotacerta", name: "Locadora Rodas & Cia", type: "client", document: "88.999.000/0001-21", email: "manutencao@rodasecia.com.br", phone: "(21) 98888-4455" },

  // Distribuidora Boa Vista
  { id: "boavista-contact-1", companyId: "company-boavista", name: "Indústria Têxtil Serra Azul", type: "supplier", document: "99.000.111/0001-32", email: "vendas@serraazul.com.br", phone: "(31) 3222-1100" },
  { id: "boavista-contact-2", companyId: "company-boavista", name: "Mercadinho Boa Esperança", type: "client", document: "10.111.222/0001-43", email: "compras@boaesperanca.com.br", phone: "(31) 98765-1122" },
  { id: "boavista-contact-3", companyId: "company-boavista", name: "Loja Estilo & Cia", type: "client", document: "20.222.333/0001-54", email: "financeiro@estiloecia.com.br", phone: "(31) 99888-3344" },
];
