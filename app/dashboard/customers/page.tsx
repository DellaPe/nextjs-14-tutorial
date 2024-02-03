import { Metadata } from "next";
import Table from "../../ui/customers/table";
import Search from "../../ui/search";
import { lusitana } from "../../ui/fonts";
import { Suspense } from "react";
import { CustomersSkeleton } from "../../ui/skeletons";

export default async function CustomersPage() {
  return (
    <>
      <h1 className={`${lusitana.className} mb-8 text-xl md:text-2xl`}>
        Customers
      </h1>
      <Search placeholder="Search customers..." />
      <Suspense fallback={<CustomersSkeleton />}>
        <Table />
      </Suspense>
    </>
  )
}

export const metadata: Metadata = {
  title: 'Customers',
};