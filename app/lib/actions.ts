'use server'
import { sql } from '@vercel/postgres'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Todas las funciones solo funcionan en el servidor, no en el cliente.
import { z } from 'zod'
import { signIn } from '../../auth'
import { AuthError } from 'next-auth'

const InvoiceSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.'
  }),
  amount: z.coerce.number().gt(0, { message: 'Please enter an amount greater than $0.' }),
  data: z.string(),
  status: z.enum(['paid', 'pending'], { invalid_type_error:  'Please select an invoice status.'}),
})

const CreateInvoiceFormSchema = InvoiceSchema.omit({ 
  id: true,
  data: true,
})

const BASE_URL_DASHBOARD = '/dashboard'
const BASE_URL_INVOICES = '/dashboard/invoices'

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

export async function createInvoice(prevState: State, formData: FormData) {
  const rawFormData = {
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  }
  // const rawFormData = Object.fromEntries(formData.entries())
  const validatedFields = CreateInvoiceFormSchema.safeParse(rawFormData)

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }
  
  const {customerId, amount, status } = validatedFields.data
  const amountInCents = amount * 100
  const [date] = new Date().toISOString().split('T')
  
  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `
  } catch (error) {
    return { message: 'Database Error: Failed to Create Invoice.', };
  }
  revalidatePath(BASE_URL_INVOICES);
  revalidatePath(BASE_URL_DASHBOARD);
  redirect(BASE_URL_INVOICES);
}

export async function updateInvoice(id: string, prevState: State, formData: FormData) {
  const rawFormData = {
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  }
  const validatedFields = CreateInvoiceFormSchema.safeParse(rawFormData)
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }
  const {customerId, amount, status } = validatedFields.data
  const amountInCents = amount * 100;
  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
  } catch (error) {
    return { message: 'Database Error: Failed to Update Invoice.' };
  }
   revalidatePath(BASE_URL_INVOICES);
   revalidatePath(BASE_URL_DASHBOARD);
   redirect(BASE_URL_INVOICES);
}

export async function deleteInvoice(id: string) {
  // throw new Error('Failed to Delete Invoice');

  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
  } catch (error) {
    return { message: 'Database Error: Failed to Delete Invoice.' };
  }
  revalidatePath(BASE_URL_DASHBOARD);
  revalidatePath(BASE_URL_INVOICES);  
}
