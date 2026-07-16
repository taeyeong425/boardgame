import { CreateRoomForm } from "@/components/landing/CreateRoomForm";
import { JoinRoomForm } from "@/components/landing/JoinRoomForm";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-10 px-6 py-12">
      <h1 className="text-center text-3xl font-bold">보드게임 나이트</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">방 만들기</h2>
        <CreateRoomForm />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">참가하기</h2>
        <JoinRoomForm />
      </section>
    </main>
  );
}
