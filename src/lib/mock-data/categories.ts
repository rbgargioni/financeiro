import { Category } from "@/lib/types";

function categoriesForCompany(companyId: string, prefix: string): Category[] {
  return [
    { id: `${prefix}-cat-vendas`, companyId, name: "Vendas", type: "receivable" },
    { id: `${prefix}-cat-servicos`, companyId, name: "Serviços prestados", type: "receivable" },
    { id: `${prefix}-cat-outras-receitas`, companyId, name: "Outras receitas", type: "receivable" },
    { id: `${prefix}-cat-fornecedores`, companyId, name: "Fornecedores", type: "payable" },
    { id: `${prefix}-cat-salarios`, companyId, name: "Salários", type: "payable" },
    { id: `${prefix}-cat-aluguel`, companyId, name: "Aluguel", type: "payable" },
    { id: `${prefix}-cat-impostos`, companyId, name: "Impostos", type: "payable" },
    { id: `${prefix}-cat-marketing`, companyId, name: "Marketing", type: "payable" },
  ];
}

export const categories: Category[] = [
  ...categoriesForCompany("company-paonosso", "paonosso"),
  ...categoriesForCompany("company-rotacerta", "rotacerta"),
  ...categoriesForCompany("company-boavista", "boavista"),
];
