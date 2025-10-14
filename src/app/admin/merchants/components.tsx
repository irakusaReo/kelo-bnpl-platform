'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getMerchants,
  approveMerchant,
  suspendMerchant,
} from '@/services/admin'
import { MerchantStore } from '@/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'

export function MerchantManagement() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')

  const {
    data: merchants,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['adminMerchants', page, pageSize, status, search],
    queryFn: () => getMerchants(page, pageSize, status, search),
  })

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMerchants'] })
      toast({ title: 'Success', description: 'Merchant updated successfully.' })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'Failed to update merchant.',
        variant: 'destructive',
      })
    },
  }

  const approveMutation = useMutation({
    mutationFn: approveMerchant,
    ...mutationOptions,
  })
  const suspendMutation = useMutation({
    mutationFn: suspendMerchant,
    ...mutationOptions,
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error fetching merchants</div>

  return (
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter by name..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="max-w-sm"
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {merchants?.map((merchant: MerchantStore) => (
            <TableRow key={merchant.id}>
              <TableCell>{merchant.name}</TableCell>
              <TableCell>{merchant.status}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() => approveMutation.mutate(merchant.id)}
                    >
                      Approve
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => suspendMutation.mutate(merchant.id)}
                    >
                      Suspend
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(page + 1)}
          disabled={!merchants || merchants.length < pageSize}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
