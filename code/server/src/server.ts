import app from '@/app';
import environment from '@/config';

app.listen(environment.port, () => {
  console.info(`Server listening on http://localhost:${environment.port}`);
});
