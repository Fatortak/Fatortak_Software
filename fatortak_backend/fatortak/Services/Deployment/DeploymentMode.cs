namespace fatortak.Services.Deployment
{
    public interface IDeploymentMode
    {
        bool IsSelfHosted { get; }
        bool AllowRegistration { get; }
    }

    public class DeploymentMode : IDeploymentMode
    {
        public DeploymentMode(IConfiguration configuration)
        {
            var mode = configuration["Deployment:Mode"];
            IsSelfHosted = string.Equals(mode, "SelfHosted", StringComparison.OrdinalIgnoreCase) ||
                           configuration.GetValue<bool>("SelfHosted:Enabled");
            AllowRegistration = IsSelfHosted
                ? configuration.GetValue("SelfHosted:AllowRegistration", true)
                : configuration.GetValue("MultiTenant:AllowRegistration", true);
        }

        public bool IsSelfHosted { get; }
        public bool AllowRegistration { get; }
    }
}
