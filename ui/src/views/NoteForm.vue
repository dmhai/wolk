import {NoteType} from "@/models/api/enums/noteType";
<template>
    <v-row
            v-shortkey="['ctrl', 's']"
            @shortkey="saveNote"
    >
        <v-col>
            <h1>{{noteId ? "Update" : "Create"}} note</h1>
            <v-dialog scrollable v-model="uiState.attachmentDialogOpened" v-if="noteId">
                <Attachments :noteId="note.id"/>
            </v-dialog>

            <div v-if="!previewing" class="form">
                <v-text-field
                        label="Note title"
                        type="text"
                        v-model="note.title"
                        @keyup="onChange"
                        @focus="showMetaInputs"
                />
                <transition name="fade">
                    <v-select
                            :items="notebooks"
                            placeholder="Select notebook..."
                            v-model="note.notebookId"
                            item-text="name"
                            item-value="id"
                            clearable
                            @change="onChange"
                            v-if="showMeta"
                    />
                </transition>
                <transition name="fade">
                    <v-select
                            :items="noteTypeNames"
                            placeholder="Select note type..."
                            v-model="note.noteType"
                            item-text="value"
                            item-value="key"
                            clearable
                            @change="onChange"
                            v-if="showMeta"
                    />
                </transition>
                <textarea
                        v-if="showTextarea"
                        v-model="note.content"
                        @input="contentInput"
                        @focus="hideMetaInputs"
                        placeholder="Note contents..."
                        ref="content"
                />
            </div>
            <NoteRender
                    v-if="previewing"
                    :contents="note.content"
                    :noteType="note.noteType"
            />
            <v-bottom-navigation color="indigo" fixed>
                <v-btn title="Save note" @click="saveNote">
                    <v-icon>mdi-content-save</v-icon>
                </v-btn>
                <v-btn title="Attachments" @click="showAttachments" v-if="noteId">
                    <v-icon>mdi-paperclip</v-icon>
                </v-btn>
                <v-btn title="View note" @click="viewNote" v-if="noteId">
                    <v-icon>mdi-eye</v-icon>
                </v-btn>
                <v-btn title="Preview note" @click="togglePreview">
                    <v-icon>{{!previewing ? "mdi-eye-outline" : "mdi-arrow-left"}}</v-icon>
                </v-btn>
                <BackToTop/>
            </v-bottom-navigation>
        </v-col>
    </v-row>
</template>

<script lang="ts">
    import {mapState} from "vuex";
    import {Component, Vue, Watch} from "vue-property-decorator";
    import Note from "../models/api/note";
    import Notebook from "../models/api/notebook";
    import {getNoteTypeArray, NoteType} from "@/models/api/enums/noteType";
    import {KeyValuePair} from "@/models/keyValuePair";
    import {eventKeys, resources} from "@/resources";
    import NoteRender from "@/components/NoteRender.vue";
    import Attachments from "@/components/Attachments.vue";
    import {UiStateModel} from "@/models/store/uiStateModel";
    import BackToTop from "@/components/BackToTop.vue";
    import {EventModel} from "@/models/store/eventModel";

    @Component({
        components: {NoteRender, Attachments, BackToTop},
        computed: mapState(["notebooks", "currentNote", "uiState", "event"]),
        beforeRouteLeave(to, from, next) {
            let form: NoteForm = this as NoteForm;
            if (form.calculateHash() === 0 || form.contentHash === form.calculateHash() || confirm(resources.unsavedChanges)) {
                next();
            }
        }
    })
    export default class NoteForm extends Vue {
        noteId: string = "";
        noteTypeNames: Array<KeyValuePair<NoteType, string>> = getNoteTypeArray();
        notebooks!: Notebook[];
        note: Note = this.emptyNote();
        previewing: boolean = false;
        showMeta: boolean = true;
        contentHash: number = 0;
        uiState!: UiStateModel;

        constructor() {
            super();
        }

        @Watch("$route")
        onRouteChanged() {
            this.reloadData();
            this.showMetaInputs()
        }

        @Watch("currentNote")
        onCurrentNoteChanged(value: Note) {
            this.note = value;
            this.$store.commit("SET_PAGE_SUB_TITLE", value.title);
            this.contentHash = this.calculateHash();
            setTimeout(() => NoteForm.updateContentInputSize(this.$refs.content as HTMLElement), 10);
        }

        @Watch("event")
        onEvent(value: EventModel) {
            if (value.key === eventKeys.noteUpdated || value.key === eventKeys.noteCreated) {
                this.contentHash = this.calculateHash();
            }
        }

        mounted() {
            this.reloadData();
        }

        onChange() {
            this.$store.commit("SET_PAGE_SUB_TITLE", this.note.title);
        }

        hideMetaInputs() {
            this.showMeta = false;
        }

        showMetaInputs() {
            this.showMeta = true;
        }

        saveNote() {
            if (!this.noteId) {
                this.$store.dispatch("createNote", this.note);
            } else {
                this.$store.dispatch("updateNote", {
                    note: this.note,
                    id: this.noteId
                });
            }
        }

        viewNote() {
            this.$router.push({name: "viewNote", params: <any>{id: this.noteId}});
        }

        emptyNote(): Note {
            return {
                id: 0,
                title: "",
                content: "",
                notebookId: 0,
                preview: "",
                noteType: NoteType.NotSet,
                created: new Date(),
                changed: new Date(),
                opened: new Date()
            };
        }

        showAttachments() {
            this.uiState.attachmentDialogOpened = !this.uiState.attachmentDialogOpened;
        }

        contentInput(e: InputEvent) {
            NoteForm.updateContentInputSize(e.target as HTMLElement);
        }

        togglePreview() {
            this.previewing = !this.previewing;
            setTimeout(() => NoteForm.updateContentInputSize(this.$refs.content as HTMLElement), 10);
        }

        get showTextarea() {
            return this.noteId || this.note.noteType !== NoteType.StickyNotes && this.note.noteType !== NoteType.TodoTxt;
        }

        private static updateContentInputSize(element: HTMLElement) {
            if (element) {
                element.style.height = `${element.scrollHeight}px`;
            }
        }

        private reloadData() {
            this.noteId = <string>this.$route.params.id;
            if (!this.noteId) {
                this.note = this.emptyNote();
            } else {
                this.$store.dispatch("loadNote", this.noteId);
            }

            this.previewing = false;
            let notebookId = <string>this.$route.query.notebookId;
            if (notebookId) {
                this.note.notebookId = parseInt(notebookId);
            }
        }

        private calculateHash(): number {
            if (!this.note.title && !this.note.content && !this.note.noteType && !this.note.notebookId) {
                return 0;
            }

            let inputString = `${this.note.title}:${this.note.content}:${this.note.noteType}:${this.note.notebookId}`;
            return inputString.hashCode();
        }
    }
</script>
<style scoped>
    textarea {
        width: 100%;
        resize: none;
    }
    .form {
        margin-bottom: 30px;
    }
</style>