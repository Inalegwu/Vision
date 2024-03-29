import { AnimatedBox, Box, Image } from "@components/atoms";
import {
  HStack,
  IssueCard,
  IssueSkeleton,
  Layout,
  Spinner,
  VStack,
} from "@components/index";
import { useObservable } from "@legendapp/state/react";
import {
  CaretLeftIcon,
  Cross1Icon,
  DotsHorizontalIcon,
  Pencil1Icon,
  PlusIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import {
  Button,
  Dialog,
  DropdownMenu,
  Flex,
  IconButton,
  Text,
} from "@radix-ui/themes";
import { trpcReact } from "@src/shared/config";
import { CollectionParams } from "@src/shared/types";
import { AnimatePresence } from "framer-motion";
import moment from "moment";
import { useCallback } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

export default function Collection() {
  const router = useNavigate();
  const utils = trpcReact.useUtils();
  const { collectionId } = useParams<CollectionParams>();

  if (!collectionId) {
    router("/");
    return;
  }

  const issuesListVisible = useObservable(false);
  const name = useObservable("");

  const { data: collection, isLoading: getting } =
    trpcReact.collection.getIssuesInCollection.useQuery(
      {
        id: collectionId || "",
      },
      {
        onSuccess: (d) => {
          name.set(d?.collection?.name || "");
        },
      },
    );

  // use this to populate the list of issues to add to the collection
  const { data: issues, isLoading: gettingIssues } =
    trpcReact.library.getIssues.useQuery();

  const { mutate: addIssueToLibrary, isLoading: saving } =
    trpcReact.collection.addIssueToCollection.useMutation({
      onSuccess: (data) => {
        toast.success(`${data.result[0].name} Added To Collection`);
        utils.collection.getIssuesInCollection.invalidate();
        utils.library.invalidate();
        issuesListVisible.set(false);
      },
    });

  const { mutate: deleteCollectionFromDB } =
    trpcReact.collection.deleteCollection.useMutation({
      onSuccess: () => {
        utils.library.getLibrary.invalidate();
        router("/");
      },
      onError: (err) => {
        toast.error(err.message);
      },
    });

  // add an issue to the collection
  const addToLibrary = useCallback(
    (v: string) => {
      addIssueToLibrary({ childId: v, ownerId: collectionId || "" });
    },
    [collectionId, addIssueToLibrary],
  );

  const goBack = useCallback(() => {
    // @ts-ignore go back
    router(-1, {
      preventScrollReset: true,
      unstable_viewTransition: true,
    });
  }, [router]);

  // delete this collection from the database
  // this however doens't delete the issues in said collection
  // because the user might want to hold onto those
  const deleteCollection = useCallback(() => {
    if (!collection) return;
    deleteCollectionFromDB({ id: collection?.collection?.id || "" });
  }, [collection, deleteCollectionFromDB]);

  // handle clicking the edit button
  const handleEditClick = useCallback(() => {
    router(`/collections/edit/${collection?.collection?.id}`);
  }, [router, collection]);

  return (
    <Layout>
      <Box className="w-full h-screen">
        <Flex direction="column" p="2" gap="2" className="w-full">
          <HStack>
            <IconButton onClick={goBack} size="3" variant="soft">
              <CaretLeftIcon width="16" height="16" />
            </IconButton>
          </HStack>
          <Flex align="center" justify="between" className="w-full mt-2 px-1">
            <Text size="8" weight="medium">
              {name.get()}
            </Text>
            <HStack
              alignContent="center"
              alignItems="center"
              justifyContent="flex-end"
              gap={6}
            >
              <Dialog.Root>
                <Dialog.Trigger>
                  <Button color="gray" variant="soft">
                    Add Issue
                    <PlusIcon height={15} width={15} />
                  </Button>
                </Dialog.Trigger>
                <Dialog.Content size="4">
                  <Dialog.Title>
                    Add an Issue to {collection?.collection?.name}
                  </Dialog.Title>
                  <Dialog.Description size="3">
                    any issue selected will be added to the collection , don't
                    worry , you can always remove it
                  </Dialog.Description>
                  <Flex
                    direction="column"
                    gap="2"
                    align="start"
                    justify="start"
                    className="mt-2"
                  >
                    {issues?.issues.length === 0 && (
                      <Text color="red" weight="medium" size="3">
                        No Issues to add
                      </Text>
                    )}
                    {issues?.issues.map((v) => {
                      return (
                        <Dialog.Close>
                          <Button
                            key={v.id}
                            className="p-4 w-[95%]"
                            variant="ghost"
                            color="gray"
                            onClick={() => addToLibrary(v.id)}
                          >
                            <Flex grow="1" align="end" gap="4" justify="start">
                              <img
                                className="w-13 h-20 rounded-sm"
                                src={v.thumbnailUrl}
                                alt={v.name}
                              />
                              <Text size="3">{v.name}</Text>
                            </Flex>
                          </Button>
                        </Dialog.Close>
                      );
                    })}
                  </Flex>
                </Dialog.Content>
              </Dialog.Root>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                  <Button variant="soft" color="gray">
                    <DotsHorizontalIcon />
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content
                  variant="soft"
                  className="p-0 mt-3 space-y-3"
                >
                  <DropdownMenu.Item
                    onClick={handleEditClick}
                    className="gap-3"
                  >
                    Edit Collection
                    <Pencil1Icon />
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    color="red"
                    onClick={deleteCollection}
                    className="gap-3 mt-2"
                  >
                    Delete Collection
                    <TrashIcon />
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </HStack>
          </Flex>
        </Flex>
        <Flex
          align="start"
          justify="start"
          gap="3"
          wrap="wrap"
          className="h-[90%] p-3 pt-4 overflow-y-scroll pb-20"
        >
          {collection?.collection?.issues?.length === 0 && (
            <Box
              css={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                width: "100%",
                height: "100%",
                alignContent: "center",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text>Such Empty 😣</Text>
              <Button
                disabled={saving}
                onClick={() => issuesListVisible.set(true)}
              >
                <Text>Add To Collection</Text>
                <PlusIcon />
              </Button>
            </Box>
          )}
          {/* add issue view */}
          <AnimatePresence>
            {issuesListVisible.get() && (
              <AnimatedBox
                initial={{ top: "100%" }}
                animate={{ top: "35%" }}
                exit={{ top: "100%" }}
                transition={{
                  duration: 0.3,
                  ease: "easeInOut",
                }}
                css={{
                  width: 500,
                  height: 500,
                  borderTopRightRadius: "$xl",
                  overflowY: "scroll",
                  background: "$blackMuted",
                  backdropFilter: "blur(500px)",
                  position: "absolute",
                  zIndex: 5,
                  left: 0,
                  top: "50%",
                  border: "0.1px solid $lightGray",
                }}
              >
                <Box
                  css={{
                    width: "100%",
                    padding: "$lg",
                    display: "flex",
                    alignContent: "center",
                    alignItems: "center",
                    justifyContent: "flex-end",
                  }}
                >
                  <Button onClick={() => issuesListVisible.set(false)}>
                    <Cross1Icon width={16} height={16} />
                  </Button>
                </Box>
                {gettingIssues && <Spinner size={20} />}
                {issues?.issues.map((v) => {
                  return (
                    <Box
                      key={v.id}
                      onClick={() => addToLibrary(v.id)}
                      css={{
                        display: "flex",
                        alignContent: "flex-end",
                        alignItems: "flex-end",
                        justifyContent: "flex-start",
                        padding: "$lg",
                        gap: "$xl",
                        width: "100%",
                        borderBottom: "0.1px solid rgba(255,255,255,0.3)",
                        transition: "0.3s ease-in-out",
                        "&:hover": {
                          background: "$secondary",
                        },
                      }}
                    >
                      <Image
                        src={v.thumbnailUrl}
                        css={{ width: 42, height: 52, borderRadius: "$md" }}
                      />
                      <VStack
                        alignContent="flex-start"
                        alignItems="flex-start"
                        justifyContent="center"
                        style={{
                          width: "100%",
                          height: 50,
                        }}
                      >
                        <Text>{v.name}</Text>
                        <Text>{moment(v.dateCreated).fromNow()}</Text>
                      </VStack>
                    </Box>
                  );
                })}
              </AnimatedBox>
            )}
          </AnimatePresence>
          {collection?.collection?.issues.map((v) => {
            return <IssueCard issue={v} key={v.id} />;
          })}
          {getting &&
            [...Array(10)].map((_, idx) => <IssueSkeleton key={`${idx}`} />)}
        </Flex>
      </Box>
    </Layout>
  );
}
