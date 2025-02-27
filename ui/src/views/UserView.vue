<template>
  <main>
    <div class="mt-4 container">
      <div class="card p-4">
        <div class="row">
          <div class="col"><h2>Benutzerliste</h2></div>
          <div class="col-auto"><button type="button" @click="goToNewUser" class="btn btn-success">Neuer Benutzer</button></div>
        </div>
        <template v-if="isMobileView">
          <template v-for="user in userList" :key="user.username">
            <div class="card mb-1">
              <div class="card-header">
                <div class="row">
                  <div class="col">
                    <h5>{{ user.username }}</h5>
                  </div>
                  <div class="col">
                    <div class="d-flex justify-content-end">
                      <button @click="delUser(user.id, user.username)" type="button" class="btn btn-danger">
                        <i class="bi bi-trash"></i>
                      </button>
                      <button @click="editUser(user.id)" class="btn btn-primary ms-1">
                        <i class="bi bi-pencil"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col">
                    aktiv:
                  </div>
                  <div class="col">
                    <input
                      v-if="user.enabled === '1'"
                      type="checkbox"
                      :checked="user.enabled === '1'"
                      style="pointer-events: none"
                      class="form-check-input form-check-input-black"
                      readonly
                    />
                  </div>
                </div>
                <div class="row">
                  <div class="col">
                    Rollen:
                  </div>
                  <div class="col">
                    <ul class="list-group list-group-flush">
                      <li v-for="role in user.parsedRoles" :key="role" class="">
                        {{ role }}
                      </li>
                    </ul>
                  </div>
                </div>
                <select v-model="user.verein_id" @change="changeVereinsId(user)" class="form-select">
                  <option v-for="verein in vereineList" :key="verein.id" :value="verein.id">{{ verein.name }}</option>
                </select>
              </div>
            </div>
          </template>
        </template>
        <template v-else>
          <table class="table table">
            <thead>
              <tr>
                <th scope="col">Benutzername</th>
                <th scope="col">E-Mail</th>
                <th scope="col">Aktiv</th>
                <th scope="col">Rollen</th>
                <th scope="col">Team</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in userList" :key="user.username">
                <td>{{ user.username }}</td>
                <td>{{ user.email }}</td>
                <td>
                  <input
                    v-if="user.enabled === '1'"
                    type="checkbox"
                    :checked="user.enabled === '1'"
                    style="pointer-events: none"
                    class="form-check-input form-check-input-black"
                    readonly
                  />
                </td>
                <td>
                  <ul class="list-group list-group-flush">
                    <li v-for="role in user.parsedRoles" :key="role" class="">
                      {{ role }}
                    </li>
                  </ul>
                </td>
                <td>
                  <select v-model="user.verein_id" @change="changeVereinsId(user)" class="form-select">
                    <option v-for="verein in vereineList" :key="verein.id" :value="verein.id">{{ verein.name }}</option>
                  </select>
                </td>
                <td>
                  <button @click="delUser(user.id, user.username)" type="button" class="btn btn-danger">
                    <i class="bi bi-trash"></i>
                  </button>
                  <button @click="editUser(user.id)" class="btn btn-primary ms-1">
                    <i class="bi bi-pencil"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </template>
      </div>
    </div>

    <!-- Bestätigungs-Modal -->
    <div
      v-if="isModalVisible"
      class="modal fade show"
      style="display: block;"
      tabindex="-1"
      role="dialog"
    >
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Löschen bestätigen</h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <p>Möchtest du diesen Benutzer <span class="fw-bold">{{ delUserName }}</span> wirklich löschen?</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">
              Abbrechen
            </button>
            <button type="button" class="btn btn-danger" @click="deleteUser">
              Löschen
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Overlay (optional für Hintergrund) -->
    <div v-if="isModalVisible" class="modal-backdrop fade show"></div>

  </main>
</template>

<script setup>
  import { onMounted, reactive, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { useUserStore } from '@/stores/userStore';
  import { useDialogStore } from '@/stores/dialogStore';

  const userStore = useUserStore();
  const userList = reactive([]);
  const delUserName = ref('');
  const delUserId = ref(0);
  const vereineList = reactive([]);
  const dialogStore = useDialogStore();

  const isMobileView = ref(window.innerWidth <= 768);

  async function changeVereinsId(user) {
    console.log('changeVereinsId user', user);
    try {
      const response = await fetch('/api/setUserVereinsId', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user }),
        credentials: 'include'  // Cookies mitsenden
      });

      if (!response.ok) {
        console.log('Es gab ein Problem mit dem setzen der Vereins Id');
        setTimeout(() => {
          dialogStore.setParameter('Eehler beim setzen der Vereins Id', `${response.message}`, 'ok', null, '', null, null);
        }, 1000);
      }
    } catch (error) {
      console.error('Es gab ein Problem mit dem setzen der Vereins Id', error);
      setTimeout(() => {
        dialogStore.setParameter('Es gab ein Problem mit dem setzen der Vereins Id', `${error}`, 'ok', null, '', null, null);
      }, 1000);
    }
  }

  async function getUserList() {
    try {
      const response = await fetch('/api/getUserList', {
        method: 'GET',
        credentials: 'include'  // Cookies mitsenden
      });

      const result = await response.json();

      if (response.ok) {
        userList.splice(0);

        for (const user of result.users) {
          userList.push(user);
        }

        for (const user of userList) {
          if (user.roles) {
            try {
              user.parsedRoles = JSON.parse(user.roles);
            } catch (error) {
              console.error('Parsen der Rollen war nicht möglich', error);
            }
          } else {
            user.parsedRoles = [];
          }
        }

      } else if (response.status === 401) {
        // Benutzer aus dem Store entfernen
        await userStore.logout()

        userStore.setMessage('Session ist abgelaufen bitte neu Anmelden');

        // weiterleiten zum login
        router.push('/login');
      } else {
        console.log(result.message || 'keine Daten vorhanden');
      }
    } catch (error) {
      console.error('Es gab ein Problem mit dem Abrufen der getUserList:', error);
    }
  }

  async function getVereineList() {
    try {
      let response;
      response = await fetch(`/api/getVereineList`, {
        method: 'GET',
        credentials: 'include'  // Cookies mitsenden
      });

      const result = await response.json();

      console.log('getVerineList result', result);

      if (response.ok) {
        vereineList.splice(0);

        for (const vereine of result.vereineList) {
          vereineList.push(vereine);
        }

        getUserList();

      } else {
        setTimeout(() => {
          dialogStore.setParameter('Fehlercode 103', `${response.status} ${response.statusText}`, 'ok', null, '', null, null);
        }, 1000);
        console.log(result.message || 'keine Daten vorhanden');
      }
    } catch (error) {
      console.error('Es gab ein Problem mit dem Abrufen der getVereineList:', error);
      setTimeout(() => {
        dialogStore.setParameter('Fehlercode 107', `${error.message}`, 'ok', null, '', null, null);
      }, 1000);
    }
  }

  onMounted(() => {
    console.log('onMounted');
    getVereineList();
  });

  const router = useRouter();
  const goToNewUser = () => {
    router.push('/newuser');
  };

  const delUser = (id, username) => {
    console.log('delUser', id);
    delUserName.value = username;
    delUserId.value = id;
    showDeleteConfirmation();
  }

  function editUser (id) {
    console.log('editUser', id);

    //ausgewählten User in store Schreiben
    for (const user of userList) {
      if (user.id === id) {
        userStore.setEditUser(user);
      }
    }

    // zum Formular wechseln
    router.push('/edituser');
  }

  // Zustandsvariable für das Modal
  const isModalVisible = ref(false);

  // Modal öffnen
  function showDeleteConfirmation () {
    isModalVisible.value = true;
  }

  // Modal schließen
  function closeModal() {
    isModalVisible.value = false;
  }

  // Benutzer löschen
  async function deleteUser() {
    // Hier kannst du die Funktionalität zum Löschen des Benutzers aufrufen
    try {
      console.log('deleteUser', delUserId.value);
      const response = await fetch('/api/deluser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: delUserId.value }),
        credentials: 'include'  // Cookies mitsenden
      });

      if (response.ok) {
        // Benutzerliste wieder abfragen
        getUserList();
      } else {
        console.log('Es gab ein Problem mit dem löschen des Benutzers');
      }
    } catch (error) {
      console.error('Es gab ein Problem mit dem löschen des Benutzers:', error);
    }

    // Modal schließen nach dem Löschen
    closeModal();
  }
</script>

<style scoped>
  .form-check-input-black {
    background-color: black;
    border-color: black;
  }
</style>