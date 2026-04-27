import { useCallback, useEffect, useState } from "react";
import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { User } from "@/types";
import {
  useApiUrl,
  useCreate,
  useCustomMutation,
  useGetIdentity,
  useList,
} from "@refinedev/core";
import { Loader2, PlusCircle, Search, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { CreateButton } from "@/components/refine-ui/buttons/create";
import { DeleteButton } from "@/components/refine-ui/buttons/delete";
import { ListView } from "@/components/refine-ui/views/list-view";
import { Input } from "@/components/ui/input";

interface ClassItem {
  id: number;
  name: string;
  status: string;
  capacity: number;
  subject?: { name: string; code: string };
  department?: { name: string };
  teacher?: { name: string };
}

interface Enrollment {
  studentId: string;
  classId: number;
}

const EnrollmentsList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: currentUser } = useGetIdentity<User>();
  const studentId = currentUser?.id ?? "";
  const [actionClassId, setActionClassId] = useState<number | null>(null);
  const [enrolledIds, setEnrolledIds] = useState<Set<number>>(new Set());
  const navigate = useNavigate();
  const apiUrl = useApiUrl();
  console.log("apiUrl:", apiUrl); // add this line

  const { query: classesQuery } = useList<ClassItem>({
    resource: "classes",
    pagination: { pageSize: 100 },
    filters: [
    {
      field: "search",
      operator: "contains",
      value: searchQuery,
    },
  ],
  });

  // Fetch enrollments directly — waits until studentId is available
  const fetchEnrollments = useCallback(async () => {
    if (!studentId) return;
    try {
      const res = await fetch(`${apiUrl}enrollments/student/${studentId}`);
      const json = await res.json();
      const ids = new Set<number>(
        (json.data as Enrollment[]).map((e) => e.classId),
      );
      setEnrolledIds(ids);
    } catch (err) {
      console.error("Failed to fetch enrollments:", err);
    }
  }, [studentId, apiUrl]);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  const { mutateAsync: enroll } = useCreate();
  const { mutateAsync: unenroll } = useCustomMutation();

  const handleEnroll = async (classId: number) => {
    setActionClassId(classId);
    try {
      const response = await enroll({
        resource: "enrollments",
        values: { classId, studentId },
      });
      await fetchEnrollments();
      navigate("/enrollments/confirm", {
        state: { enrollment: response?.data },
      });
    } catch (err) {
      console.error(err);
      setActionClassId(null);
    }
  };

  const handleUnenroll = async (classId: number) => {
    setActionClassId(classId);
    try {
      await unenroll({
        url: `${apiUrl}enrollments/${studentId}/${classId}`,
        method: "delete",
        values: {},
      });
      await fetchEnrollments();
    } catch (err) {
      console.error(err);
    } finally {
      setActionClassId(null);
    }
  };

  const classes = classesQuery.data?.data ?? [];
  const isLoading = classesQuery.isLoading || !currentUser;

  return (
    <ListView>
      <Breadcrumb />

      <h1 className="page-title">Classes</h1>

      <div className="intro-row">
        <p className="text-muted-foreground text-sm mb-4">
          Browse and manage your enrollments.
          {enrolledIds.size > 0 && (
            <span className="ml-1 font-medium text-foreground">
              ({enrolledIds.size} enrolled)
            </span>
          )}
        </p>

        <div className="actions-row">
          <div className="search-field">
            <Search className="search-icon" />

            <Input
              type="text"
              placeholder="Search by name..."
              className="pl-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Separator className="mb-6" />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {classes.map((c) => {
            const isEnrolled = enrolledIds.has(c.id);
            const isBusy = actionClassId === c.id;
            return (
              <Card
                key={c.id}
                className="relative overflow-hidden border border-border/60 hover:shadow-md transition-all duration-200"
              >
                <div
                  className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${
                    isEnrolled
                      ? "from-orange-500 to-transparent"
                      : "from-border to-transparent"
                  }`}
                />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{c.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {c.subject?.code} · {c.subject?.name}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {isEnrolled && <Badge>Enrolled</Badge>}
                      <Badge variant="outline" className="text-xs capitalize">
                        {c.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-4 text-sm text-muted-foreground mb-4">
                    <span>{c.department?.name}</span>
                    <span>{c.teacher?.name}</span>
                    <span>{c.capacity} seats</span>
                  </div>

                  <div className="flex justify-end">
                    {isEnrolled ? (
                      <DeleteButton
                        resource="enrollments"
                        disabled={isBusy}
                        onClick={() => handleUnenroll(c.id)}
                      >
                        {isBusy ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        Unenroll
                      </DeleteButton>
                    ) : (
                      <CreateButton
                        resource="enrollments"
                        disabled={isBusy || c.status !== "active"}
                        onClick={() => handleEnroll(c.id)}
                      >
                        {isBusy ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        ) : (
                          <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        Enroll
                      </CreateButton>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </ListView>
  );
};

export default EnrollmentsList;
