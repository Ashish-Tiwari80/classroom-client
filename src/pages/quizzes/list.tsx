import { CreateButton } from "@/components/refine-ui/buttons/create";
import { ShowButton } from "@/components/refine-ui/buttons/show";
import { DataTable } from "@/components/refine-ui/data-table/data-table";
import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb";
import { ListView } from "@/components/refine-ui/views/list-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Quiz } from "@/types";
import { useGetIdentity } from "@refinedev/core";
import { useTable } from "@refinedev/react-table";
import { ColumnDef } from "@tanstack/react-table";
import { BarChart2, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const difficultyVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  easy: "secondary",
  medium: "default",
  hard: "destructive",
};

type UserAttempt = { id: number; score: number } | null;

type QuizWithAttempt = Quiz & { userAttempt: UserAttempt };

const QuizzesList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const { data: user } = useGetIdentity();
  const navigate = useNavigate();
  const userId = user?.id;

  const difficultyFilters =
    selectedDifficulty === "all"
      ? []
      : [
          {
            field: "difficulty",
            operator: "eq" as const,
            value: selectedDifficulty,
          },
        ];

  const searchFilters = searchQuery
    ? [{ field: "topic", operator: "contains" as const, value: searchQuery }]
    : [];

  const userIdFilter = userId
    ? [{ field: "userId", operator: "eq" as const, value: userId }]
    : [];

  const quizTable = useTable<QuizWithAttempt>({
    columns: useMemo<ColumnDef<QuizWithAttempt>[]>(
      () => [
        {
          id: "subject",
          accessorKey: "subject.name",
          size: 180,
          header: () => <p className="column-title ml-2">Subject</p>,
          cell: ({ getValue }) => (
            <Badge variant="secondary">{getValue<string>()}</Badge>
          ),
        },
        {
          id: "topic",
          accessorKey: "topic",
          size: 230,
          header: () => <p className="column-title ml-2">Topic</p>,
          cell: ({ getValue }) => (
            <span className="text-foreground">{getValue<string>()}</span>
          ),
          filterFn: "includesString",
        },
        {
          id: "numQuestions",
          accessorKey: "numQuestions",
          size: 110,
          header: () => <p className="column-title">Questions</p>,
          cell: ({ getValue }) => (
            <Badge variant="outline">{getValue<number>()} Qs</Badge>
          ),
        },
        {
          id: "difficulty",
          accessorKey: "difficulty",
          size: 110,
          header: () => <p className="column-title">Difficulty</p>,
          cell: ({ getValue }) => {
            const val = getValue<string>();
            return (
              <Badge variant={difficultyVariant[val] ?? "default"}>
                {val.charAt(0).toUpperCase() + val.slice(1)}
              </Badge>
            );
          },
        },
        {
          id: "status",
          size: 120,
          header: () => <p className="column-title">Status</p>,
          cell: ({ row }) => {
            const attempt = row.original.userAttempt;
            if (!attempt) return <Badge variant="outline">Not Attempted</Badge>;
            return (
              <Badge
                variant="secondary"
                className="border-green-500/50 text-green-700 bg-green-500/10"
              >
                ✓ {attempt.score}%
              </Badge>
            );
          },
        },
        {
          id: "createdAt",
          accessorKey: "createdAt",
          size: 130,
          header: () => <p className="column-title">Created</p>,
          cell: ({ getValue }) => (
            <span className="text-muted-foreground text-sm">
              {new Date(getValue<string>()).toLocaleDateString()}
            </span>
          ),
        },
        {
          id: "action",
          size: 160,
          header: () => <p className="column-title">Action</p>,
          cell: ({ row }) => {
            const attempt = row.original.userAttempt;
            const quizId  = row.original.id;
 
            if (attempt) {
              return (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => navigate(`/quizzes/show/${quizId}`)}
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  View Analysis
                </Button>
              );
            }
 
            return (
              <ShowButton
                resource="quizzes"
                recordItemId={quizId}
                variant="outline"
                size="sm"
              >
                Take Quiz
              </ShowButton>
            );
          },
        },
      ],
      [navigate],
    ),
    refineCoreProps: {
      resource: "quizzes",
      pagination: { pageSize: 10, mode: "server" },
      filters: {
        permanent: [...difficultyFilters, ...searchFilters, ...userIdFilter],
      },
      sorters: {
        initial: [{ field: "id", order: "desc" }],
      },
    },
  });

  return (
    <ListView>
      <Breadcrumb />

      <h1 className="page-title">Quizzes</h1>

      <div className="intro-row">
        <p>Browse and take AI-generated quizzes across all subjects.</p>

        <div className="actions-row">
          <div className="search-field">
            <Search className="search-icon" />

            <Input
              type="text"
              placeholder="Search by topic..."
              className="pl-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Select
              value={selectedDifficulty}
              onValueChange={setSelectedDifficulty}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by difficulty..." />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                {DIFFICULTY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(user?.role === "admin" || user?.role === "teacher") && <CreateButton />}
          </div>
        </div>
      </div>

      <DataTable table={quizTable} />
    </ListView>
  );
};

export default QuizzesList;
