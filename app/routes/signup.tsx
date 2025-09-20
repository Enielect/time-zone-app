import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "This is the Signup page" },
    {
      name: "signUp Page",
      content: "Sign up to our app to enjoy seamless communication",
    },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  return { message: "This is the loading message I guess" };
}

export default function Signup({ loaderData }: Route.ComponentProps) {
  return (
    <div>
      <h3>TThis is the Signup page</h3>
      <p>{loaderData.message}</p>

      <form className="signup-form">
        <div>
          <label htmlFor="email">Email:</label>
          <input type="email" id="email" name="email" required />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input type="password" id="password" name="password" required />
        </div>
        <div>
          <label htmlFor="confirmPassword">Confirm Password:</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            required
          />
        </div>
        <button type="submit">Sign Up</button>
      </form>
    </div>
  );
}
