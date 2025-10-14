'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUsers, suspendUser, unsuspendUser, changeUserRole } from '@/services/admin'
import { Profile } from '@/types/profile'
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

export function UserManagement() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')

  const {
    data: users,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['adminUsers', page, pageSize, search],
    queryFn: () => getUsers(page, pageSize, search),
  })

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
      toast({ title: 'Success', description: 'User updated successfully.' })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'Failed to update user.',
        variant: 'destructive',
      })
    },
  }

  const suspendMutation = useMutation({
    mutationFn: suspendUser,
    ...mutationOptions,
  })
  const unsuspendMutation = useMutation({
    mutationFn: unsuspendUser,
    ...mutationOptions,
  })
  const changeRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      changeUserRole(userId, role),
    ...mutationOptions,
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error fetching users</div>

  return (
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter by name or email..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="max-w-sm"
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users?.map((user: Profile) => (
            <TableRow key={user.id}>
              <TableCell>
                {user.first_name} {user.last_name}
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>{user.status}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() => suspendMutation.mutate(user.id)}
                    >
                      Suspend
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => unsuspendMutation.mutate(user.id)}
                    >
                      Unsuspend
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        changeRoleMutation.mutate({
                          userId: user.id,
                          role: 'Merchant',
                        })
                      }
                    >
                      Make Merchant
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        changeRoleMutation.mutate({
                          userId: user.id,
                          role: 'User',
                        })
                      }
                    >
                      Make User
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
          disabled={!users || users.length < pageSize}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
