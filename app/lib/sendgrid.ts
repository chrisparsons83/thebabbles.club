import * as sg from "@sendgrid/mail";

export type SendGridError = {
  response?: {
    body: string;
  };
};

function isSendGridError(error: unknown): error is SendGridError {
  return (error as SendGridError).response !== undefined;
}

sg.setApiKey(process.env.SENDGRID_API_KEY || "");

export default sg;
export { isSendGridError };
