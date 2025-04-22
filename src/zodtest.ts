import { z } from "zod";

const userSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  age: z.number().min(18),
});

export type IUser = z.infer<typeof userSchema>;

const data = {
  id: 8,
  name: "Sbr",
  age: 21,
  isActive: true,
};

const obj = userSchema.safeParse(data);
if (obj.success) {
  const user = obj.data;
  console.log("tyyy", user);
} else {
  obj.error;
  console.log("jhgfghghjh");
}
