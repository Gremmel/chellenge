<template>
  <main>
    <div class="text-center mt-4">
      <h2 v-if="userActive">
        Herausforderungen
      </h2>
      <div v-if="userActive" class="container">
        <div v-for="challenge in challengeList" :key="challenge.id" class="card mb-2">
          <div class="card-header">
            <span class="challengeName">{{ challenge.name }}</span>
            <button
              v-if="isAdmin"
              class="btn btn-danger btn-sm float-end"
              @click="clickDeleteChallenge(challenge)"
            >
              <i class="bi bi-trash"></i>
            </button>
          </div>
          <div class="card-body">
            <!-- laufende challenge -->
            <template v-if="challenge.started">
              <!-- gesamt zähler -->
              <div v-if="challenge.finished">
                {{ challenge.countDone }} von {{ challenge.count }} (geschlossen)
              </div>
              <div v-else-if="challenge.restCount > 0">
                <template v-if="challenge.nochTage > 1">
                  noch {{ challenge.restCount }} von {{ challenge.count }} (noch {{ challenge.nochTage }} Tage)
                </template>
                <template v-if="challenge.nochTage == 1">
                  noch {{ challenge.restCount }} von {{ challenge.count }} (noch Heute)
                </template>
              </div>
              <div v-else>
                <template v-if="challenge.nochTage > 1">
                  {{ challenge.countDone }} von {{ challenge.count }} (noch {{ challenge.nochTage }} Tage)
                </template>
                <template v-if="challenge.nochTage == 1">
                  {{ challenge.countDone }} von {{ challenge.count }} (noch Heute)
                </template>
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
                  class="progress-bar progress-bar-striped bg-primary" :class="{ 'bg-success': challenge.restCount <= 0 }"
                  :style="{ width: (challenge.countDone / challenge.count) * 100 + '%' }"
                ></div>
              </div>
              <!-- tages zähler -->
              <template v-if="challenge.finished === false">
                <div v-if="challenge.restTagesCount > 0">
                  Heute noch {{ challenge.restTagesCount }} von {{ challenge.tagesCount }}
                </div>
                <div v-else>
                  Heute: {{ challenge.countDatumHeute }}<span v-if="challenge.tagesCount > 0"> von {{ challenge.tagesCount }}</span>
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
                    class="progress-bar progress-bar-striped bg-secondary" :class="{ 'bg-success': challenge.restTagesCount <= 0 }"
                    :style="{ width: (challenge.countDatumHeute / challenge.tagesCount) * 100 + '%' }"
                  ></div>
                </div>
                <div>
                  <div class="input-group mt-2">
                    <label class="input-group-text">Anzahl</label>
                    <input
                      :disabled="disableButtons"
                      type="number"
                      class="form-control"
                      v-model="challenge.countInput"
                    >
                    <button
                      :disabled="disableButtons"
                      class="btn btn-primary"
                      @click="clickSave(challenge)"
                    >
                      Speichern
                    </button>
                  </div>
                </div>
              </template>
            </template>
            <!-- noch nicht gestartet -->
            <template v-else>
              <template v-if="challenge.nochTage > 1">
                startet in {{ challenge.nochTage }} Tagen<br>
              </template>
              <template v-else>
                startet Morgen<br>
              </template>
              Start: {{ new Date(challenge.startDatum).toLocaleDateString('de-DE') }} - Ende: {{ new Date(challenge.endDatum).toLocaleDateString('de-DE') }}<br>
              laufzeit: {{ challenge.zeitraumTage }} Tage <br>
                Übungen pro Tag {{ Math.ceil(challenge.count / challenge.zeitraumTage) }}
            </template>
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
import { useUserStore } from '@/stores/userStore';
import { useDialogStore } from '@/stores/dialogStore';

const challenges = reactive([]);
const userStore = useUserStore();
const dialogStore = useDialogStore();
const disableButtons = ref(false);
const delChallengeId = ref(0);

const isAdmin = computed(() => {
  return userStore.hasRole('admin');
});

const userActive = computed(() => {
  return userStore.isEnabled;
});

const deleteChallenge = async () => {
  console.log('deleteChallenge challengeId', delChallengeId.value);
  let response;

  try {
    response = await fetch(`/api/deleteChallenge/${delChallengeId.value}`, {
      method: 'POST',
      credentials: 'include'
    });

    const result = await response.json();

    if (response.ok) {
      getChallenges();
    } else {
      console.error('Error:', result.message);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

const clickDeleteChallenge = (challenge) => {
  console.log('clickDeleteChallenge', challenge.id);
  delChallengeId.value = challenge.id;

  dialogStore.openDeleteDialog(
    'Herausforderung löschen',
    `die Herausforderung <b>${challenge.name}</b> wirklich löschen?`,
    deleteChallenge,
  );
}

const sendCounter = async (counterObj) => {
  let response;

  try {
    response = await fetch(`/api/setCount`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(counterObj)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Error:', result.message);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Neuen Zähler speichern
const clickSave = async (challengeData) => {
  startTimer();

  if (challengeData.countInput === undefined || challengeData.countInput === '') {
    return;
  }

  disableButtons.value = true;
  let countDone = 0;
  let datumHeute = challengeData.datumHeute;
  let countDatumHeute = challengeData.countDatumHeute + parseInt(challengeData.countInput)

  console.log(' datumHeute', datumHeute);

  for (const challenge of challenges) {
    if (challenge.id === challengeData.id) {
      challenge.countDone += parseInt(challengeData.countInput);
      countDone = challenge.countDone;
      challenge.countDatumHeute += parseInt(challengeData.countInput);
    }
  }

  await sendCounter({ userId: userStore.user.id, challengeId: challengeData.id, count: countDone, countDatumHeute, datumHeute });
  disableButtons.value = false;
}

// Berechnete ChallengeList
const challengeList = computed(() => {
  const list = [];

  for (const challenge of challenges) {
    if (challenge.countDone === undefined) {
      challenge.countDone = 0;
    }

    let finished = false;

    // wenn enddatum der challenge kleiner als heute ist, dann countDone = count
    if (new Date(challenge.endDatum + 'T00:00:00') < new Date()) {
      finished = true;
    }

    let started = true;

    // wenn startdatum der challenge größer als heute ist, dann countDone = 0
    if (new Date(challenge.startDatum + 'T00:00:00') > new Date()) {
      started = false;
    }

    let active = false;

    if (started && !finished) {
      active = true;
    }

    let nochTage;
    let tagesCount;
    let zeitraumTage = Math.ceil((new Date(challenge.endDatum + 'T00:00:00') - new Date(challenge.startDatum + 'T00:00:00')) / (1000 * 60 * 60 * 24));

    if (!started) {
      nochTage = Math.ceil((new Date(challenge.startDatum + 'T00:00:00') - new Date()) / (1000 * 60 * 60 * 24));
      tagesCount = 0;
    } else if (!finished) {
      // Anzahl Tage bis zum Ende der Challenge
      nochTage = Math.ceil((new Date(challenge.endDatum + 'T00:00:00') - new Date()) / (1000 * 60 * 60 * 24));
      // Anzahl Übungen pro tag
      tagesCount = (challenge.count - challenge.countDone + challenge.countDatumHeute) / nochTage;

      // Aufrunden
      tagesCount = Math.ceil(tagesCount);
    } else {
      nochTage = 0;
      tagesCount = 0;
    }

    list.push({
      id: challenge.id,
      name: challenge.name,
      startDatum: challenge.startDatum,
      endDatum: challenge.endDatum,
      countDatumHeute: challenge.countDatumHeute,
      datumHeute: challenge.datumHeute,
      nochTage,
      tagesCount,
      finished,
      started,
      active,
      zeitraumTage,
      restTagesCount: tagesCount - challenge.countDatumHeute,
      count: challenge.count,
      countDone: challenge.countDone,
      restCount: challenge.count - challenge.countDone || challenge.count
    });
  }

  list.sort((a, b) => {
    if (a.active && !b.active) return -1;
    if (!a.active && b.active) return 1;
    if (!a.started && b.started) return -1;
    if (a.started && !b.started) return 1;
    if (a.finished && !b.finished) return 1;
    if (!a.finished && b.finished) return -1;
    return 0;
  });

  return list;
});

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

const getChallenges = async () => {
  let response;

  try {
    response = await fetch(`/api/getChallenges/${userStore.user.id}`, {
      method: 'GET',
      credentials: 'include'  // Cookies mitsenden
    });

    const result = await response.json();
    console.log('getChallenges result', result);

    if (response.ok) {
      challenges.splice(0);

      for (const challange of result.list) {
        challenges.push(challange);
      }

      startTimer();
    } else {
      console.error('Error:', result.message);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

let timerValue;

const startTimer = () => {
  clearTimeout(timerValue);

  timerValue = setTimeout(() => {
    console.log('timer getChallenges');
    getChallenges();
  }, 60 * 60 * 1000);
}

onMounted(async () => {
  //getSessionData();
  getChallenges();
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

.challengeName {
  font-size: 1.5em;
}
</style>