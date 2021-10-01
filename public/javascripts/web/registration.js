/* global makeRequest */

/* Constants */

const URL_REGISTRATION = '/api/users';

/* JQuery */
const $fullname = $('#fullname');
const $password = $('#password');

const $registration = $('#registration');

/* Functions */

$(document).ready(async () => {
  $registration
    .on('click', async () => {
      const fullname = $fullname.val();
      const password = $password.val();

      if (!fullname) {
        $fullname.css({ borderColor: 'red' });
        alert('Введите Nickname');
        return false;
      }

      if (!fullname) {
        $password.css({ borderColor: 'red' });
        alert('Введите Password');
        return false;
      }

      const resultRegistration = await makeRequest({
        method: 'POST',
        url: URL_REGISTRATION,
        body: {
          fullname,
          password,
        },
      });

      if (!resultRegistration || !resultRegistration.status) {
        alert(resultRegistration.message || 'Couldnt makeRequest');
        return false;
      }

      location.href = '/';
    });
});
