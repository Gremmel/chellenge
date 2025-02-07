<template>
  <main>
    <div class="text-center mt-4">
      <h2>
        Chellenge Februar
      </h2>
      <div class="container">
        <div v-for="chellenge in chellengeList" :key="chellenge.id" class="card mb-2">
          <div class="card-header">
            {{ chellenge.name }}
          </div>
          <div class="card-body">
            <!-- gesamt zähler -->
            noch {{ chellenge.restCount }} von {{ chellenge.count }} ({{ chellenge.nochTage }} Tage)
            <div
              class="progress"
              role="progressbar"
              aria-label="Success striped example"
              aria-valuenow="25"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <div
                class="progress-bar progress-bar-striped bg-success"
                :style="{ width: (chellenge.countDone / chellenge.count) * 100 + '%' }"
              ></div>
            </div>
            <!-- tages zähler -->
            Heute noch {{ chellenge.restTagesCount }} von {{ chellenge.tagesCount }}
            <div
              class="progress"
              role="progressbar"
              aria-label="Success striped example"
              aria-valuenow="25"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <div
                class="progress-bar progress-bar-striped bg-success"
                :style="{ width: (chellenge.countDatumHeute / chellenge.tagesCount) * 100 + '%' }"
              ></div>
            </div>
            <div>
              <div class="input-group mt-2">
                <div class="input-group-prebend">
                  <label class="input-group-text">Anzahl</label>
                </div>
                <input
                  :disabled="disableButtons"
                  type="number"
                  class="form-control"
                  v-model="chellenge.countInput"
                >
                <div class="input-group-append">
                  <button
                    :disabled="disableButtons"
                    class="btn btn-primary"
                    @click="clickSave(chellenge)"
                  >
                    Speichern
                  </button>
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
import { reactive, ref, computed, onMounted } from 'vue';
import { useUserStore } from '@/stores/userStore';

const chellenges = reactive([]);
const userStore = useUserStore();
const disableButtons = ref(false);

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
const clickSave = async (chellengeData) => {
  disableButtons.value = true;
  let countDone = 0;
  let datumHeute = chellengeData.datumHeute;
  let countDatumHeute = chellengeData.countDatumHeute + parseInt(chellengeData.countInput)

  console.log(' datumHeute', datumHeute);

  for (const chellenge of chellenges) {
    if (chellenge.id === chellengeData.id) {
      chellenge.countDone += parseInt(chellengeData.countInput);
      countDone = chellenge.countDone;
      chellenge.countDatumHeute += parseInt(chellengeData.countInput);
    }
  }

  await sendCounter({ userId: userStore.user.id, chellengeId: chellengeData.id, count: countDone, countDatumHeute, datumHeute });
  disableButtons.value = false;
}

// Berechnete ChellengeList
const chellengeList = computed(() => {
  const list = [];

  for (const chellenge of chellenges) {
    if (chellenge.countDone === undefined) {
      chellenge.countDone = 0;
    }

    // Anzahl Tage bis zum Ende der Chellenge
    const nochTage = Math.ceil((new Date(chellenge.endDatum) - new Date()) / (1000 * 60 * 60 * 24));
    // Anzahl Übungen pro tag
    let tagesCount = (chellenge.count - chellenge.countDone + chellenge.countDatumHeute) / nochTage;

    // Aufrunden
    tagesCount = Math.ceil(tagesCount);

    list.push({
      id: chellenge.id,
      name: chellenge.name,
      startDatum: chellenge.startDatum,
      endDatum: chellenge.endDatum,
      countDatumHeute: chellenge.countDatumHeute,
      datumHeute: chellenge.datumHeute,
      nochTage,
      tagesCount,
      restTagesCount: tagesCount - chellenge.countDatumHeute,
      count: chellenge.count,
      countDone: chellenge.countDone,
      restCount: chellenge.count - chellenge.countDone || chellenge.count
    });
  }
  return list;
});

const getChellenges = async () => {
  let response;

  try {
    response = await fetch(`/api/getChellenges/${userStore.user.id}`, {
      method: 'GET',
      credentials: 'include'  // Cookies mitsenden
    });

    const result = await response.json();
    console.log('getChellenges result', result);

    if (response.ok) {
      chellenges.splice(0);

      for (const challange of result.list) {
        chellenges.push(challange);
      }
    } else {
      console.error('Error:', result.message);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

onMounted(async () => {
  getChellenges();
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