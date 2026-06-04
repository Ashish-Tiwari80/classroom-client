import { ShowButton } from "@/components/refine-ui/buttons/show";
import { DataTable } from "@/components/refine-ui/data-table/data-table";
import {
  ShowView,
  ShowViewHeader,
} from "@/components/refine-ui/views/show-view";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Department, Subject } from "@/types";
import { useGetIdentity, useLink, useShow } from "@refinedev/core";
import { useTable } from "@refinedev/react-table";
import { ColumnDef } from "@tanstack/react-table";
import { BarChart2 } from "lucide-react";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router";

type SubjectDetails = {
  subject: Subject & {
    department?: Department | null;
  };
  totals: {
    classes: number;
    quizzes: number;
  };
};

type SubjectClass = {
  id: number;
  name: string;
  status?: string | null;
  capacity?: number | null;
  teacher?: {
    id: string;
    name: string;
    email?: string | null;
    image?: string | null;
  } | null;
};

type SubjectUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string | null;
};

type QuizAttemptRow = {
  id: number;
  quizId: number;
  userId: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  createdAt: string;
  analysis?: { scoreLabel?: string } | null;
  // joined fields from backend
  quiz?: { topic: string; difficulty: string } | null;
  user?: { name: string; email: string; image?: string | null } | null;
};

const getInitials = (name = "") => {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "";
  return `${parts[0][0] ?? ""}${
    parts[parts.length - 1][0] ?? ""
  }`.toUpperCase();
};

const scoreBadgeVariant = (
  score: number,
): "default" | "secondary" | "destructive" | "outline" => {
  if (score >= 75) return "default";
  if (score >= 50) return "secondary";
  return "destructive";
};

const SubjectsShow = () => {
  const Link = useLink();
  const navigate = useNavigate();
  const { id } = useParams();
  const subjectId = id ?? "";

  const { data: identity } = useGetIdentity<{ id: string; role: string }>();
  const isTeacherOrAdmin =
    identity?.role === "admin" || identity?.role === "teacher";

  const { query } = useShow<SubjectDetails>({ resource: "subjects" });
  const details = query.data?.data;

  const classColumns = useMemo<ColumnDef<SubjectClass>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        size: 240,
        header: () => <p className="column-title">Class</p>,
        cell: ({ getValue }) => (
          <span className="text-foreground">{getValue<string>()}</span>
        ),
      },
      {
        id: "teacher",
        accessorKey: "teacher",
        size: 220,
        header: () => <p className="column-title">Teacher</p>,
        cell: ({ row }) => {
          const teacher = row.original.teacher;
          if (!teacher) {
            return <span className="text-muted-foreground">Unassigned</span>;
          }

          return (
            <div className="flex items-center gap-2">
              <Avatar className="size-7">
                {teacher.image && (
                  <AvatarImage src={teacher.image} alt={teacher.name} />
                )}
                <AvatarFallback>{getInitials(teacher.name)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col truncate">
                <span className="truncate">{teacher.name}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {teacher.email}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        id: "status",
        accessorKey: "status",
        size: 120,
        header: () => <p className="column-title">Status</p>,
        cell: ({ getValue }) => {
          const status = getValue<string>();
          return (
            <Badge variant={status === "active" ? "default" : "secondary"}>
              {status ?? "unknown"}
            </Badge>
          );
        },
      },
      {
        id: "details",
        size: 140,
        header: () => <p className="column-title">Details</p>,
        cell: ({ row }) => (
          <ShowButton
            resource="classes"
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

  const quizAttemptColumns = useMemo<ColumnDef<QuizAttemptRow>[]>(
    () => [
      {
        id: "student",
        size: 220,
        header: () => <p className="column-title">Student</p>,
        cell: ({ row }) => {
          const u = row.original.user;
          if (!u) {
            return (
              <span className="font-mono text-xs text-muted-foreground">
                {row.original.userId}
              </span>
            );
          }
          return (
            <div className="flex items-center gap-2">
              <Avatar className="size-7">
                {u.image && <AvatarImage src={u.image} alt={u.name} />}
                <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col truncate">
                <span className="truncate">{u.name}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {u.email}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        id: "quiz",
        accessorKey: "quiz.topic",
        size: 200,
        header: () => <p className="column-title">Quiz</p>,
        cell: ({ row }) => {
          const quiz = row.original.quiz;
          if (!quiz) return <span className="text-muted-foreground">—</span>;
          return (
            <div className="flex flex-col gap-0.5">
              <span className="truncate text-foreground">{quiz.topic}</span>
              <Badge variant="outline" className="w-fit text-xs">
                {quiz.difficulty}
              </Badge>
            </div>
          );
        },
      },
      {
        id: "score",
        accessorKey: "score",
        size: 100,
        header: () => <p className="column-title">Score</p>,
        cell: ({ row }) => (
          <Badge variant={scoreBadgeVariant(row.original.score)}>
            {row.original.score}%
          </Badge>
        ),
      },
      {
        id: "correct",
        size: 110,
        header: () => <p className="column-title">Correct</p>,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.correctCount} / {row.original.totalQuestions}
          </span>
        ),
      },
      {
        id: "label",
        size: 150,
        header: () => <p className="column-title">AI Label</p>,
        cell: ({ row }) => {
          const label = row.original.analysis?.scoreLabel;
          if (!label) return <span className="text-muted-foreground">—</span>;
          return <Badge variant="secondary">{label}</Badge>;
        },
      },
      {
        id: "date",
        accessorKey: "createdAt",
        size: 130,
        header: () => <p className="column-title">Date</p>,
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">
            {new Date(getValue<string>()).toLocaleDateString()}
          </span>
        ),
      },
      {
        id: "details",
        size: 130,
        header: () => <p className="column-title">Details</p>,
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() =>
              navigate(`/quizzes/show/${row.original.quizId}`)
            }
          >
            <BarChart2 className="w-3.5 h-3.5" />
            View
          </Button>
        ),
      },
    ],
    [navigate],
  );


  const userColumns = useMemo<ColumnDef<SubjectUser>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        size: 240,
        header: () => <p className="column-title">User</p>,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Avatar className="size-7">
              {row.original.image && (
                <AvatarImage src={row.original.image} alt={row.original.name} />
              )}
              <AvatarFallback>{getInitials(row.original.name)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col truncate">
              <span className="truncate">{row.original.name}</span>
              <span className="text-xs text-muted-foreground truncate">
                {row.original.email}
              </span>
            </div>
          </div>
        ),
      },
      {
        id: "role",
        accessorKey: "role",
        size: 140,
        header: () => <p className="column-title">Role</p>,
        cell: ({ getValue }) => (
          <Badge variant="secondary">{getValue<string>()}</Badge>
        ),
      },
      {
        id: "details",
        size: 140,
        header: () => <p className="column-title">Details</p>,
        cell: ({ row }) => (
          <ShowButton
            resource="users"
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

  const classesTable = useTable<SubjectClass>({
    columns: classColumns,
    refineCoreProps: {
      resource: `subjects/${subjectId}/classes`,
      pagination: {
        pageSize: 10,
        mode: "server",
      },
    },
  });

  const quizAttemptsTable = useTable<QuizAttemptRow>({
    columns: quizAttemptColumns,
    refineCoreProps: {
      resource: `subjects/${subjectId}/quiz-attempts`,
      pagination: { pageSize: 10, mode: "server" },
      queryOptions: { enabled: isTeacherOrAdmin && !!subjectId },
    },
  });

  const teachersTable = useTable<SubjectUser>({
    columns: userColumns,
    refineCoreProps: {
      resource: `subjects/${subjectId}/users`,
      pagination: {
        pageSize: 10,
        mode: "server",
      },
      filters: {
        permanent: [
          {
            field: "role",
            operator: "eq",
            value: "teacher",
          },
        ],
      },
    },
  });

  const studentsTable = useTable<SubjectUser>({
    columns: userColumns,
    refineCoreProps: {
      resource: `subjects/${subjectId}/users`,
      pagination: {
        pageSize: 10,
        mode: "server",
      },
      filters: {
        permanent: [
          {
            field: "role",
            operator: "eq",
            value: "student",
          },
        ],
      },
    },
  });

  if (query.isLoading || query.isError || !details) {
    return (
      <ShowView className="class-view">
        <ShowViewHeader resource="subjects" title="Subject Details" />
        <p className="text-sm text-muted-foreground">
          {query.isLoading
            ? "Loading subject details..."
            : query.isError
            ? "Failed to load subject details."
            : "Subject details not found."}
        </p>
      </ShowView>
    );
  }

  const totalAttempts = (quizAttemptsTable.refineCore.tableQuery?.data)?.total ?? 0;

  return (
    <ShowView className="class-view space-6">
      <ShowViewHeader resource="subjects" title={details?.subject.name} />

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex w-full flex-row items-center justify-between">
          <CardTitle>Subject Overview</CardTitle>
          <Badge>{details.subject.code}</Badge>
        </CardHeader>

        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {details.subject.description ?? "No description provided."}
          </p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle>Department</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {details.subject.department ? (
            <>
              <Link
                to={`/departments/show/${details.subject.department.id}`}
                className="text-lg font-semibold text-foreground hover:underline"
              >
                {details.subject.department.name}
              </Link>
              <p className="text-sm text-muted-foreground">
                {details.subject.department.description ??
                  "No department description provided."}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Department not assigned.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Classes</CardTitle>
          <Badge variant="secondary">{details.totals.classes}</Badge>
        </CardHeader>
        <CardContent>
          <DataTable table={classesTable} paginationVariant="simple" />
        </CardContent>
      </Card>

      {isTeacherOrAdmin && (
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Quiz Attempts</CardTitle>
            <div className="flex items-center gap-2">
              {details.totals.quizzes > 0 && (
                <Badge variant="outline">
                  {details.totals.quizzes}{" "}
                  {details.totals.quizzes === 1 ? "Quiz" : "Quizzes"}
                </Badge>
              )}
              <Badge variant="secondary">
                {totalAttempts}{" "}
                {totalAttempts === 1 ? "Attempt" : "Attempts"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable table={quizAttemptsTable} paginationVariant="simple" />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable table={teachersTable} paginationVariant="simple" />
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Students</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable table={studentsTable} paginationVariant="simple" />
          </CardContent>
        </Card>
      </div>
    </ShowView>
  );
};

export default SubjectsShow;
