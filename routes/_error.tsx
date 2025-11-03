import { HttpError, PageProps } from "fresh";

export default function ErrorPage(props: PageProps) {
  const error = props.error;
  if (error instanceof HttpError) {
    const status = error.status;

    if (status === 404) {
      return <h1>404 - Page not found</h1>;
    }
  }
  console.error(error);
  return <h1>Unexpected Error</h1>;
}
