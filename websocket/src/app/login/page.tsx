import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Choose a provider to sign in</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <form
            action={async () => {
              "use server";
              await signIn("github");
            }}
          >
            <Button type="submit" className="w-full" variant="outline">
              Sign in with GitHub
            </Button>
          </form>
          <form
            action={async () => {
              "use server";
              await signIn("google");
            }}
          >
            <Button type="submit" className="w-full" variant="outline">
              Sign in with Google
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
