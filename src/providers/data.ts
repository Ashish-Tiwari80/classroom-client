import {
  BaseRecord,
  DataProvider,
  GetListParams,
  GetListResponse,
} from "@refinedev/core";
import { Subject } from "../types";

const mockSubjects: Subject[] = [
  {
    id: 1,
    code: "CS101",
    name: "Introduction to Computer Science",
    department: "Computer Science",
    description: "Fundamentals of programming, algorithms, and computational thinking for beginners.",
    createdAt: "2024-01-15T00:00:00Z",
  },
  {
    id: 2,
    code: "MATH201",
    name: "Calculus II",
    department: "Mathematics",
    description: "Advanced integration techniques, series, differential equations, and multivariable calculus.",
    createdAt: "2024-01-15T00:00:00Z",
  },
  {
    id: 3,
    code: "ENG150",
    name: "English Literature",
    department: "English",
    description: "Survey of English literature from the Middle Ages to the present, analyzing major works, authors, and literary movements.",
    createdAt: "2024-01-15T00:00:00Z",
  },
];

export const dataProvider: DataProvider = {
  getList: async <TData extends BaseRecord = BaseRecord>({
    resource,
  }: GetListParams): Promise<GetListResponse<TData>> => {
    if (resource !== "subjects") return { data: [] as TData[], total: 0 };

    return {
      data: mockSubjects as unknown as TData[],
      total: mockSubjects.length,
    };
  },

  getOne: async () => { throw new Error('This function is not present in mock') },
  create: async () => { throw new Error('This function is not present in mock') },
  update: async () => { throw new Error('This function is not present in mock') },
  deleteOne: async () => { throw new Error('This function is not present in mock') },

  getApiUrl: () => '',
};
