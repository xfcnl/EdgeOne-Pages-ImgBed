import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const [email, password] = process.argv.slice(2);

if (!serviceKey) {
  console.error("缺少 SUPABASE_SERVICE_ROLE_KEY 环境变量");
  process.exit(1);
}
if (!email || !password) {
  console.error("用法: node scripts/set-password.mjs <邮箱> <新密码>");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

const {
  data: { users },
  error: listErr,
} = await supabase.auth.admin.listUsers();
if (listErr) {
  console.error("查询用户失败:", listErr.message);
  process.exit(1);
}

const user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
if (!user) {
  console.error("找不到用户:", email);
  process.exit(1);
}

const { error } = await supabase.auth.admin.updateUserById(user.id, {
  password,
});
if (error) {
  console.error("设置密码失败:", error.message);
  process.exit(1);
}

console.log("密码设置成功！");
