<template>
  <main>
    <div class="text-center mt-4">
      <div v-if="userActive" class="container">
        <div v-if="statusDataRescieved === false">
          <div v-if="showSpinner" class="d-flex justify-content-center">
            <div class="spinner-border" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
        <div v-else-if="challengeList.length === 0">
          <h2>Keine Challenge aktiv</h2>
        </div>
        <div v-else>
          <select v-model="selectedChallenge" class="form-select mb-2">
            <option v-for="challenge in challengeList" :key="challenge.id" :value="challenge.id">{{ challenge.name }}</option>
          </select>
          <div v-if="selectedChallenge">
            <div v-for="team in teamList" :key="team.name" class="card mb-2">
              <div class="card-header">
                <div class="d-flex justify-content-between w-100">
                  <span>{{ team.name }}</span>
                  <span v-if="team.neededCountHeute > 0 && team.neededCountHeute < team.restCount" style="font-size: 0.8rem;" class="align-self-end">
                    noch {{ team.neededCountHeute }} | {{ team.restCount }}
                  </span>
                  <span v-else style="font-size: 0.8rem;" class="align-self-end">
                    <template v-if="team.restCount > 0">
                      noch {{ team.restCount }}
                    </template>
                    <template v-else>
                      + {{ team.restCount *-1 }}
                    </template>
                  </span>
                </div>
                <div
                  class="progress"
                  role="progressbar"
                  aria-label="Success striped example"
                  aria-valuenow="25"
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  <div
                    class="progress-bar progress-bar-striped"
                    :class="{ 'bg-success': team.sumCount >= team.neededCount, 'bg-danger': team.sumCount < team.neededCount }"
                    style="overflow: visible; white-space: nowrap;"
                    :style="{ width: team.prozent + '%' }"
                  >
                    <span v-if="team.prozent >= 10">
                       {{ team.prozent }} %
                    </span>
                  </div>
                  <div
                    class="progress-bar progress-bar-striped"
                    style="background-color: lightgray; overflow: visible; white-space: nowrap;"
                    :style="{ width: team.restHeuteProzent + '%' }"
                  >
                    <span v-if="team.prozent < 10" class="ms-1 text-start" style="color: black;">
                       {{ team.prozent }} %
                    </span>
                  </div>
                </div>
              </div>
              <div class="card-body">
                <div v-for="user in team.users" :key="user.id" class="row mb-1">
                  <div class="col-4 text-start">
                    {{ user.username }}
                  </div>
                  <div class="col">
                    <div
                      class="progress"
                      role="progressbar"
                      aria-label="Success striped example"
                      aria-valuenow="25"
                      aria-valuemin="0"
                      aria-valuemax="100"
                    >
                      <div
                        class="progress-bar progress-bar-striped bg-secondary" :class="{ 'bg-success': user.prozent >= 100 }"
                        :style="{ width: user.prozent + '%' }"
                      >
                        <span v-if="user.prozent >= 10 || isMobileView === false">{{ user.count }}</span>
                      </div>
                      <span v-if="user.prozent < 10 && isMobileView === true" class="ms-1">{{ user.count }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- user ist nicht Aktiv -->
      <div v-else class="container mt-4">
        <div class="alert alert-warning" role="alert">
          <h4>Du bist in der aktuellen Challenge nicht aktiviert</h4>
        </div>
      </div>

    </div>
  </main>
</template>

<script setup>
import { reactive, ref, computed, onMounted, onUnmounted } from 'vue';
import { useDialogStore } from '@/stores/dialogStore';
import { useUserStore } from '@/stores/userStore';

const dialogStore = useDialogStore();
const userStore = useUserStore();
const vereineList = reactive([]);
const challengeList = reactive([]);
const selectedChallenge = ref(null);
const statusDataRescieved = ref(false);
const showSpinner = ref(false);

setTimeout(() => {
  showSpinner.value = true;
}, 2000);

const userActive = computed(() => {
  return userStore.isEnabled;
});

const isMobileView = ref(window.innerWidth <= 768);

const teamList = computed(() => {
  const teams = {};
  let selChallenge;

  userStore.setSelectedChallenge(selectedChallenge.value);

  for (const challenge of challengeList) {
    if (challenge.id === selectedChallenge.value) {
      selChallenge = challenge;
      break;
    }
  }

  if (!selChallenge) {
    return teams;
  }

  for (const user of selChallenge.users) {
    if (!teams[user.verein_id]) {
      teams[user.verein_id] = {
        name: user.verein_name,
        prozent: 0,
        endCount: 0,
        sumCount: 0,
        users: [],
      };
    }

    teams[user.verein_id].users.push(user);
  }

  // prozentwerte der Teams berechnen
  for (const teamKey in teams) {
    const team = teams[teamKey];

    for (const user of team.users) {
      team.sumCount += user.count;
      user.prozent = ((user.count / selChallenge.count) * 100).toFixed(1);
    }

    team.users.sort((a, b) => {
      if (b.prozent === a.prozent) {
        return a.username.localeCompare(b.username);
      }
        return b.prozent - a.prozent;
    });

    team.endCount = selChallenge.count * team.users.length;
    team.restCount = team.endCount - team.sumCount;
    team.prozent = ((team.sumCount / team.endCount) * 100).toFixed(1);

    // Berechne die benötigten Prozente basierend auf der verbleibenden Zeit
    const challengeStartDate = new Date(selChallenge.startDatum);
    challengeStartDate.setHours(0, 0, 0, 0);

    const challengeEndDate = new Date(selChallenge.endDatum);
    challengeEndDate.setHours(0, 0, 0, 0);

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const totalChallengeDuration = (challengeEndDate - challengeStartDate) / (1000 * 60 * 60 * 24); // in Tagen
    let elapsedChallengeDuration = Math.ceil((currentDate - challengeStartDate + 1) / (1000 * 60 * 60 * 24)); // in Tagen

    if (elapsedChallengeDuration > totalChallengeDuration) {
      elapsedChallengeDuration = totalChallengeDuration;
    }
    // const remainingChallengeDuration = totalChallengeDuration - elapsedChallengeDuration;

    console.log('elapsedChallengeDuration', elapsedChallengeDuration);
    console.log('totalChallengeDuration', totalChallengeDuration);

    // berechnung der restlichen Prozente für heute
    const tagesProzent = 100 / totalChallengeDuration;
    console.log(' tagesProzent', tagesProzent);
    const sollHeuteProzent = tagesProzent * elapsedChallengeDuration;
    console.log(' sollHeuteProzent', sollHeuteProzent);

    team.restHeuteProzent = sollHeuteProzent - team.prozent;

    if (team.restHeuteProzent < 0) {
      team.restHeuteProzent = 0;
    }

    team.neededCount = Math.ceil((team.endCount / totalChallengeDuration) * elapsedChallengeDuration);
    team.neededCountHeute = team.neededCount - team.sumCount;

    console.log('team', team);
  }

  // Teams nach Prozent absteigend sortieren
  const sortedTeams = Object.values(teams).sort((a, b) => b.prozent - a.prozent);
  return sortedTeams;
});

const getStatusData = async (first = true) => {
  let response;

  if (first) {
    statusDataRescieved.value = false;
  }

  try {
    response = await fetch(`/api/getStatusData`, {
      method: 'GET',
      credentials: 'include'  // Cookies mitsenden
    });

    const result = await response.json();
    console.log('getStatusData result', result);

    statusDataRescieved.value = true;

    if (response.ok) {
      challengeList.splice(0);

      for (const challenge of result.challengeData) {
        // nur wenn challenge gestartet ist
        if (new Date() >= new Date(challenge.startDatum)) {
          challengeList.push(challenge);
        }
      }

      if (!selectedChallenge.value && challengeList.length > 0) {
        if (userStore.selectedChallenge) {
          selectedChallenge.value = userStore.selectedChallenge;
        } else {
          selectedChallenge.value = challengeList[0].id;
        }
      }

      startTimer();
    } else {
      console.error('Error:', result.message);
    }
  } catch (error) {
    console.error('Error:', error);
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

        getStatusData();

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

  async function getSessionData() {
    try {
      const response = await fetch('/api/getSession', {
        method: 'GET',
        credentials: 'include'  // Cookies mitsenden
      });

      const result = await response.json();
      console.log('getSession result', result);

      if (response.ok) {
        userStore.setUser(result.user);
      } else {
        console.log(result.message || 'keine Session Daten vorhanden');
      }
    } catch (error) {
      console.error('Es gab ein Problem mit dem Abrufen der Sessiondaten:', error);
    }
    userStore.getSessionDataFinished = true;
  }

  let timerValue;

  const startTimer = () => {
    clearTimeout(timerValue);

    timerValue = setTimeout(() => {
      console.log('timer getStatusData');
      getStatusData(false);
    }, 30 * 1000);
  }

  onMounted(() => {
    getSessionData();
    getVereineList();
  });

  onUnmounted(() => {
    console.log('onUnmounted');
    clearTimeout(timerValue);
  });

</script>

<style scoped>
.center-image {
  display: block;
  margin-left: auto;
  margin-right: auto;
  max-width: 80%;
}
</style>
