<template>
  <main>
    <div class="text-center mt-4">
      <div class="container">
        <div v-if="challengeList.length === 0">
          <h2>Keine Challenge aktiv</h2>
        </div>
        <div v-else>
          <select v-model="selectedChallenge" class="form-select mb-2">
            <option v-for="challenge in challengeList" :key="challenge.id" :value="challenge.id">{{ challenge.name }}</option>
          </select>
          <div v-if="selectedChallenge">
            <div v-for="team in teamList" :key="team.name" class="card mb-2">
              <div class="card-header">
                {{ team.name }}
                <div
                  class="progress"
                  role="progressbar"
                  aria-label="Success striped example"
                  aria-valuenow="25"
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  <div
                    class="progress-bar progress-bar-striped bg-danger"
                    :style="{ width: team.prozent + '%' }"
                  >{{ team.prozent }} %</div>
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
                      >{{ user.count }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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

    team.users.sort((a, b) => b.prozent - a.prozent);

    team.endCount = selChallenge.count * team.users.length;
    team.prozent = ((team.sumCount / team.endCount) * 100).toFixed(1);

    console.log('team team', team);
  }

  // Teams nach Prozent absteigend sortieren
  const sortedTeams = Object.values(teams).sort((a, b) => b.prozent - a.prozent);
  return sortedTeams;
});

const getStatusData = async () => {
  let response;

  try {
    response = await fetch(`/api/getStatusData`, {
      method: 'GET',
      credentials: 'include'  // Cookies mitsenden
    });

    const result = await response.json();
    console.log('getStatusData result', result);

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

  let timerValue;

  const startTimer = () => {
    clearTimeout(timerValue);

    timerValue = setTimeout(() => {
      console.log('timer getStatusData');
      getStatusData();
    }, 30 * 1000);
  }

  onMounted(() => {
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