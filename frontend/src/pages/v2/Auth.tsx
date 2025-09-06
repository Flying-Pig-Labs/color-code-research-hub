// Placeholder for AWS Amplify Authenticator with Google SSO.
// In real implementation, this would render <Authenticator socialProviders={['google']} />.
const Auth: React.FC = () => {
  return (
    <div className="p-4 space-y-2">
      <h1 className="text-2xl font-semibold">Sign In</h1>
      <p>This environment does not include AWS Amplify packages. Replace this placeholder with Amplify's <Authenticator /> component when deploying.</p>
    </div>
  );
};

export default Auth;
