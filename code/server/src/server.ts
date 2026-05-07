import app from '@/app';
import environment from '@/config';

app.listen(environment.port, environment.hostname, () => {
  console.info(`Server listening on http://${environment.hostname}:${environment.port}`);
});
