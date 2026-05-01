import { ShowButton } from "@/components/refine-ui/buttons/show";
import { DataTable } from "@/components/refine-ui/data-table/data-table";
import {
  ShowView,
  ShowViewHeader,
} from "@/components/refine-ui/views/show-view";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "@/types";
import { useShow } from "@refinedev/core";
import { useTable } from "@refinedev/react-table";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { useParams } from "react-router";

type UserDepartment = {
  id: number;
  name: string;
  code?: string | null;
  description?: string | null;
};

type UserSubject = {
  id: number;
  name: string;
  code?: string | null;
  description?: string | null;
  department?: {
    id: number;
    name: string;
    code?: string | null;
  } | null;
};

const UsersShow = () => {
  const { id } = useParams();
  const userId = id || "";

  const { query } = useShow<User>({
    resource: "users",
  });

  const user = query.data?.data;

  const departmentColumns = useMemo<ColumnDef<UserDepartment>[]>(
    () => [
      {
        id: "code",
        accessorKey: "code",
        size: 120,
        header: () => <p className="column-title ml-2">Code</p>,
        cell: ({ getValue }) => {
          const code = getValue<string>();
          return code ? (
            <Badge>{code}</Badge>
          ) : (
            <span className="text-muted-foreground ml-2">No code</span>
          );
        },
      },
      {
        id: "name",
        accessorKey: "name",
        size: 220,
        header: () => <p className="column-title">Department</p>,
        cell: ({ getValue }) => (
          <span className="text-foreground">{getValue<string>()}</span>
        ),
      },
      {
        id: "description",
        accessorKey: "description",
        size: 320,
        header: () => <p className="column-title">Description</p>,
        cell: ({ getValue }) => {
          const description = getValue<string>();

          return description ? (
            <span className="truncate line-clamp-2">{description}</span>
          ) : (
            <span className="text-muted-foreground">No description</span>
          );
        },
      },
      {
        id: "details",
        size: 140,
        header: () => <p className="column-title">Details</p>,
        cell: ({ row }) => (
          <ShowButton
            resource="departments"
            recordItemId={row.original.id}
            variant="outline"
            size="sm"
          >
            View
          </ShowButton>
        ),
      },
    ],
    [],
  );

  const subjectColumns = useMemo<ColumnDef<UserSubject>[]>(
    () => [
      {
        id: "code",
        accessorKey: "code",
        size: 120,
        header: () => <p className="column-title ml-2">Code</p>,
        cell: ({ getValue }) => {
          const code = getValue<string>();
          return code ? (
            <Badge>{code}</Badge>
          ) : (
            <span className="text-muted-foreground ml-2">No code</span>
          );
        },
      },
      {
        id: "name",
        accessorKey: "name",
        size: 220,
        header: () => <p className="column-title">Subject</p>,
        cell: ({ getValue }) => (
          <span className="text-foreground">{getValue<string>()}</span>
        ),
      },
      {
        id: "department",
        accessorKey: "department",
        size: 200,
        header: () => <p className="column-title">Department</p>,
        cell: ({ row }) => {
          const department = row.original.department;
          if (!department) {
            return <span className="text-muted-foreground">No department</span>;
          }
          return (
            <span className="truncate">
              {department.name}
              {department.code ? ` (${department.code})` : ""}
            </span>
          );
        },
      },
      {
        id: "details",
        size: 140,
        header: () => <p className="column-title">Details</p>,
        cell: ({ row }) => (
          <ShowButton
            resource="subjects"
            recordItemId={row.original.id}
            variant="outline"
            size="sm"
          >
            View
          </ShowButton>
        ),
      },
    ],
    [],
  );

  const departmentsTable = useTable<UserDepartment>({
    columns: departmentColumns,
    refineCoreProps: {
      resource: `users/${userId}/departments`,
      pagination: {
        pageSize: 10,
        mode: "server",
      },
    },
  });

  const subjectsTable = useTable<UserSubject>({
    columns: subjectColumns,
    refineCoreProps: {
      resource: `users/${userId}/subjects`,
      pagination: {
        pageSize: 10,
        mode: "server",
      },
    },
  });

  if (query.isLoading || query.isError || !user) {
    return (
      <ShowView className="class-view">
        <ShowViewHeader resource="users" title="User Details" />
        <p className="text-sm text-muted-foreground">
          {query.isLoading
            ? "Loading user details..."
            : query.isError
            ? "Failed to load user details."
            : "User details not found."}
        </p>
      </ShowView>
    );
  }

  return (
    <ShowView className="class-view space-y-6">
      <ShowViewHeader resource="users" title={user.name} />

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Profile</CardTitle>
          <Badge variant="default">{user.role}</Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="size-12">
              {user.image && <AvatarImage src={user.image} alt={user.name} />}
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Departments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Departments tied to {user.name} based on classes and enrollments.
            </p>
            <DataTable table={departmentsTable} />
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Subjects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Subjects associated with {user.name} in this term.
            </p>
            <DataTable table={subjectsTable} />
          </CardContent>
        </Card>
      </div>
    </ShowView>
  );
};

const getInitials = (name = "") => {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "";
  return `${parts[0][0] ?? ""}${
    parts[parts.length - 1][0] ?? ""
  }`.toUpperCase();
};

export default UsersShow;
