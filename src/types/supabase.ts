export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          username: string
          password: string
          role: 'SUPER_ADMIN' | 'USER'
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          username: string
          password: string
          role?: 'SUPER_ADMIN' | 'USER'
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          username?: string
          password?: string
          role?: 'SUPER_ADMIN' | 'USER'
          created_at?: string | null
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          address: string | null
          contact_person: string | null
          phone: string | null
          email: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          contact_person?: string | null
          phone?: string | null
          email?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          contact_person?: string | null
          phone?: string | null
          email?: string | null
          created_at?: string | null
        }
      }
      jobs: {
        Row: {
          id: string
          job_number: string
          customer_id: string
          make: string | null
          model: string | null
          serial_number: string | null
          remark: string | null
          taken_by: string | null
          status: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          job_number: string
          customer_id: string
          make?: string | null
          model?: string | null
          serial_number?: string | null
          remark?: string | null
          taken_by?: string | null
          status?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          job_number?: string
          customer_id?: string
          make?: string | null
          model?: string | null
          serial_number?: string | null
          remark?: string | null
          taken_by?: string | null
          status?: string | null
          created_at?: string | null
        }
      }
      inspections: {
        Row: {
          id: string
          job_id: string
          found_problems: string | null
          inspected_by: string | null
          total_amount: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          job_id: string
          found_problems?: string | null
          inspected_by?: string | null
          total_amount?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          job_id?: string
          found_problems?: string | null
          inspected_by?: string | null
          total_amount?: number | null
          created_at?: string | null
        }
      }
      spare_parts: {
        Row: {
          id: string
          inspection_id: string
          description: string | null
          quantity: number | null
          unit_price: number | null
          amount: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          inspection_id: string
          description?: string | null
          quantity?: number | null
          unit_price?: number | null
          amount?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          inspection_id?: string
          description?: string | null
          quantity?: number | null
          unit_price?: number | null
          amount?: number | null
          created_at?: string | null
        }
      }
      quotations: {
        Row: {
          id: string
          job_id: string
          quotation_number: string | null
          quotation_date: string | null
          amount: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          job_id: string
          quotation_number?: string | null
          quotation_date?: string | null
          amount?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          job_id?: string
          quotation_number?: string | null
          quotation_date?: string | null
          amount?: number | null
          created_at?: string | null
        }
      }
      approvals: {
        Row: {
          id: string
          job_id: string
          lpo_number: string | null
          reference_number: string | null
          document_url: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          job_id: string
          lpo_number?: string | null
          reference_number?: string | null
          document_url?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          job_id?: string
          lpo_number?: string | null
          reference_number?: string | null
          document_url?: string | null
          created_at?: string | null
        }
      }
      invoices: {
        Row: {
          id: string
          job_id: string
          invoice_number: string | null
          invoice_date: string | null
          amount: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          job_id: string
          invoice_number?: string | null
          invoice_date?: string | null
          amount?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          job_id?: string
          invoice_number?: string | null
          invoice_date?: string | null
          amount?: number | null
          created_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}