<template>
  <header class="app-header">
    <!-- Header Adminbereich angemeldet -->
    <div v-if="isLoggedIn">
      <nav class="navbar navbar-expand navbar-dark bg-dark">
        <div class="container-fluid">
          <a class="navbar-brand" href="#">{{ userStore.user.username }}</a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
            aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav me-auto">
              <li class="nav-item">
                <RouterLink class="nav-link" to="/">Counter</RouterLink>
              </li>
              <li class="nav-item">
                <RouterLink class="nav-link" to="/status">Status</RouterLink>
              </li>
              <li v-if="isAdmin" class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                  Admin
                </a>
                <ul class="dropdown-menu">
                  <li><RouterLink class="dropdown-item" to="/users">Benutzer</RouterLink></li>
                  <li><RouterLink class="dropdown-item" to="/newChallenge">New Challenge</RouterLink></li>
                </ul>
              </li>
            </ul>
            <div class="d-flex">
              <div class="btn-group">
                <button type="button" class="btn btn-secondary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                  ...
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                  <li><RouterLink class="dropdown-item" to="/impressum">Impressum</RouterLink></li>
                  <li><RouterLink class="dropdown-item" to="/dsgvo">Datenschutzerklärung</RouterLink></li>
                  <li><a @click="doLogout" class="dropdown-item" href="#">Logout</a></li>
                </ul>
              </div>

            </div>
          </div>
        </div>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { computed } from 'vue'
import { useUserStore } from '@/stores/userStore';
import { useRouter } from 'vue-router';
import { onMounted } from 'vue';

const userStore = useUserStore();
const isLoggedIn = computed(() => userStore.isLoggedIn);
const router = useRouter();

const isAdmin = computed(() => {
  return userStore.hasRole('admin');
});

// Benutzer abmelden
const doLogout = async () => {
  console.log('doLogout');

  // Benutzer aus dem Store entfernen
  await userStore.logout()

  // Weiterleitung nach erfolgreichem Logout
  router.push('/login');
}

onMounted(async () => {
});


</script>

<style scoped>
.app-header {
  position: fixed;
  /* Macht den Header fixiert */
  top: 0;
  /* Setzt ihn an den oberen Rand */
  left: 0;
  /* Setzt ihn an den linken Rand */
  width: 100%;
  /* Header soll die gesamte Breite einnehmen */
  /* background-color: #fff; Hintergrundfarbe (anpassen nach Bedarf) */
  z-index: 1000;
  /* Stellt sicher, dass der Header über anderen Inhalten liegt */
}
</style>
