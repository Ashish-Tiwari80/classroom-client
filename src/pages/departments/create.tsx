import { zodResolver } from "@hookform/resolvers/zod";
import { type BaseRecord, type HttpError, useBack } from "@refinedev/core";
import { useForm } from "@refinedev/react-hook-form";
import * as z from "zod";

import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb";
import { CreateView } from "@/components/refine-ui/views/create-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const departmentSchema = z.object({
  code: z.string().min(2, "Department code must be at least 2 characters"),
  name: z.string().min(3, "Department name must be at least 3 characters"),
  description: z
    .string()
    .min(5, "Department description must be at least 5 characters"),
});

type DepartmentFormValues = z.infer<typeof departmentSchema>;

const DepartmentsCreate = () => {
  const back = useBack();

  const form = useForm<BaseRecord, HttpError, DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    refineCoreProps: {
      resource: "departments",
      action: "create",
    },
    defaultValues: {
      code: "",
      name: "",
      description: "",
    },
  });

  const {
    refineCore: { onFinish },
    handleSubmit,
    formState: { isSubmitting },
    control,
  } = form;

  const onSubmit = async (values: DepartmentFormValues) => {
    try {
      await onFinish(values);
    } catch (error) {
      console.error("Error creating department:", error);
    }
  };

  return (
    <CreateView className="class-view">
      <Breadcrumb />

      <h1 className="page-title">Create a Department</h1>
      <div className="intro-row">
        <p>Provide the required information below to add a department.</p>
        <Button onClick={() => back()}>Go Back</Button>
      </div>

      <Separator />

      <CardContent className="mt-7">
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Department Code <span className="text-orange-600">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., CS" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Department Name <span className="text-orange-600">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Computer Science" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Description <span className="text-orange-600">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the department focus..."
                      className="min-h-28"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Department"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </CreateView>
  );
};

export default DepartmentsCreate;
