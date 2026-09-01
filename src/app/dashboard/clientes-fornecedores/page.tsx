"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { listContacts, createContact, deleteContact } from "@/lib/data/contacts";
import { Contact, ContactType } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Label, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

const TABS: { value: ContactType | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "client", label: "Clientes" },
  { value: "supplier", label: "Fornecedores" },
];

export default function ClientesFornecedoresPage() {
  const { company } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ContactType | "all">("all");
  const [modalOpen, setModalOpen] = useState(false);

  const [name, setName] = useState("");
  const [type, setType] = useState<ContactType>("client");
  const [document, setDocument] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  async function reload() {
    if (!company) return;
    const cts = await listContacts(company.id);
    setContacts(cts);
    setLoading(false);
  }

  useEffect(() => {
    setLoading(true);
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!company) return;
    await createContact({ companyId: company.id, name, type, document, email, phone });
    setName("");
    setDocument("");
    setEmail("");
    setPhone("");
    setModalOpen(false);
    await reload();
  }

  async function handleDelete(id: string) {
    await deleteContact(id);
    await reload();
  }

  const filtered = tab === "all" ? contacts : contacts.filter((c) => c.type === tab);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Clientes e Fornecedores</h1>
          <p className="text-sm text-slate-500">Cadastro de contatos usados nos lançamentos financeiros.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} />
          Novo contato
        </Button>
      </div>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t.value ? "bg-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
              <th className="px-5 py-3 font-medium">Nome</th>
              <th className="px-5 py-3 font-medium">Tipo</th>
              <th className="px-5 py-3 font-medium">Documento</th>
              <th className="px-5 py-3 font-medium">E-mail</th>
              <th className="px-5 py-3 font-medium">Telefone</th>
              <th className="px-5 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {!loading &&
              filtered.map((c) => (
                <tr key={c.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-3 text-slate-800">{c.name}</td>
                  <td className="px-5 py-3">
                    <Badge tone={c.type === "client" ? "indigo" : "slate"}>
                      {c.type === "client" ? "Cliente" : "Fornecedor"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{c.document}</td>
                  <td className="px-5 py-3 text-slate-500">{c.email}</td>
                  <td className="px-5 py-3 text-slate-500">{c.phone}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                  Nenhum contato cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo contato">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="contact-name">Nome</Label>
            <Input id="contact-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="contact-type">Tipo</Label>
            <Select id="contact-type" value={type} onChange={(e) => setType(e.target.value as ContactType)}>
              <option value="client">Cliente</option>
              <option value="supplier">Fornecedor</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="contact-document">CNPJ/CPF</Label>
            <Input id="contact-document" value={document} onChange={(e) => setDocument(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact-email">E-mail</Label>
              <Input id="contact-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="contact-phone">Telefone</Label>
              <Input id="contact-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
