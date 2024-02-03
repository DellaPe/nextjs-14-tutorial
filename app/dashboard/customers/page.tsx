import { Metadata } from "next";
import Table from "../../ui/customers/table";
import { fetchFilteredCustomers } from "../../lib/data";

export default async function CustomersPage({ searchParams }: { searchParams?: { query: string }}) {
  const query = searchParams?.query || '';
  const customers = await fetchFilteredCustomers(query);
  
  return <Table customers={customers} />
}

export const metadata: Metadata = {
  title: 'Customers',
};